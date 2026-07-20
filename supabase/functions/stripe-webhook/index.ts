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
      const sub = event.data.object as Stripe.Subscription
      await setOrgByCustomer(sub.customer as string, {
        subscription_tier: "free",
        subscription_status: "canceled",
        stripe_subscription_id: null,
      })
      break
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.customer) {
        await setOrgByCustomer(invoice.customer as string, { subscription_status: "past_due" })
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
