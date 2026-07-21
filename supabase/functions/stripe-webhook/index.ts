import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@17?target=deno"

// Receives Stripe subscription lifecycle events and keeps
// organizations.subscription_tier/status/stripe_subscription_id in sync.
// Registered directly in the Stripe dashboard (not called by the app), so
// this verifies the Stripe-Signature header instead of a Supabase JWT —
// verify_jwt is deliberately off for this function; deployed with a custom
// auth check (Stripe's own HMAC signature) per the platform's own guidance
// for webhook-style functions.
Deno.serve(async (req: Request) => {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")
  if (!stripeSecretKey || !webhookSecret) {
    return new Response("Stripe ist noch nicht konfiguriert.", { status: 503 })
  }

  const signature = req.headers.get("Stripe-Signature")
  if (!signature) return new Response("Missing signature", { status: 400 })

  const body = await req.text()
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook signature invalid: ${err instanceof Error ? err.message : String(err)}`, {
      status: 400,
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  async function setOrgByCustomer(customerId: string, patch: Record<string, unknown>) {
    await adminClient.from("organizations").update(patch).eq("stripe_customer_id", customerId)
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const tier = ["active", "trialing"].includes(sub.status) ? "pro" : "free"
      await setOrgByCustomer(sub.customer as string, {
        subscription_tier: tier,
        subscription_status: sub.status,
        stripe_subscription_id: sub.id,
      })
      break
    }
    case "customer.subscription.deleted": {
      // Deliberately does NOT zero out subscription_tier/subscription_valid_until
      // here: the customer already paid for their current 30-day window, so
      // access should keep running until that window actually elapses (checked
      // against subscription_valid_until on every read, see src/lib/limits.ts),
      // not end abruptly the moment they cancel.
      const sub = event.data.object as Stripe.Subscription
      await setOrgByCustomer(sub.customer as string, { subscription_status: "canceled" })
      break
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.customer) {
        await setOrgByCustomer(invoice.customer as string, { subscription_status: "past_due" })
      }
      break
    }
    case "invoice.payment_succeeded": {
      // The actual, verified "who paid and when" event — every access grant
      // is anchored to a real successful payment here, valid for exactly 30
      // days from that payment, regardless of Stripe's own billing-cycle
      // dates. This re-confirms tier/customer on every renewal too, so a
      // stale or manually-edited row can never grant access beyond what was
      // actually paid for.
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.customer) {
        const paidAtSeconds = invoice.status_transitions?.paid_at ?? event.created
        const paidAt = new Date(paidAtSeconds * 1000)
        const validUntil = new Date(paidAt.getTime() + 30 * 24 * 60 * 60 * 1000)
        await setOrgByCustomer(invoice.customer as string, {
          subscription_tier: "pro",
          subscription_status: "active",
          subscription_valid_until: validUntil.toISOString(),
        })
      }
      break
    }
    default:
      break
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
