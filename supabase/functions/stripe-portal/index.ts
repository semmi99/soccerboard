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

// Opens Stripe's hosted Billing Portal for the caller's own organization, so
// they can update payment details, view invoices, or cancel — without us
// building any of that UI ourselves.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")
  const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173"
  if (!stripeSecretKey) return json({ error: "Stripe ist noch nicht konfiguriert." }, 503)

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
    .select("stripe_customer_id")
    .eq("id", profile.org_id)
    .single()
  if (orgError || !org?.stripe_customer_id) {
    return json({ error: "Noch kein Stripe-Kunde für diese Organisation." }, 404)
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  })

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appUrl}/account`,
  })

  return json({ url: session.url })
})
