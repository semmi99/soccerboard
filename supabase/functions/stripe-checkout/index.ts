import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@17?target=deno"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// Starts a Stripe Checkout session so the caller's own organization can
// subscribe to the Pro plan. Creates (and remembers on the org row) a
// Stripe customer on first use. The service-role key only ever lives here;
// the caller's own JWT is verified against Supabase auth before anything
// else happens — never trust a client-supplied org id.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")
  const priceId = Deno.env.get("STRIPE_PRICE_ID_PRO")
  const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173"
  if (!stripeSecretKey || !priceId) {
    return json({ error: "Stripe ist noch nicht konfiguriert." }, 503)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const jwt = authHeader.replace("Bearer ", "")
  const { data: userData, error: userError } = await adminClient.auth.getUser(jwt)
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401)

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("org_id")
    .eq("id", userData.user.id)
    .single()
  if (profileError || !profile) return json({ error: "Kein Profil gefunden." }, 404)

  const { data: org, error: orgError } = await adminClient
    .from("organizations")
    .select("id, name, stripe_customer_id")
    .eq("id", profile.org_id)
    .single()
  if (orgError || !org) return json({ error: "Keine Organisation gefunden." }, 404)

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  })

  let customerId = org.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: userData.user.email,
      metadata: { org_id: org.id },
    })
    customerId = customer.id
    await adminClient.from("organizations").update({ stripe_customer_id: customerId }).eq("id", org.id)
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/account?checkout=success`,
    cancel_url: `${appUrl}/account?checkout=cancelled`,
    metadata: { org_id: org.id },
    subscription_data: { metadata: { org_id: org.id } },
  })

  return json({ url: session.url })
})
