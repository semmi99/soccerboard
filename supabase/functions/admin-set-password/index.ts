import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

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

// Lets a platform admin set a new password for any user. The service-role
// key only ever lives here (server-side Edge Function env), never in the
// client bundle. Every request re-verifies the CALLER's own JWT and looks
// up their profile's is_platform_admin flag directly in the database —
// a client-supplied "I'm an admin" claim is never trusted.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

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
    .select("is_platform_admin")
    .eq("id", userData.user.id)
    .single()

  if (profileError || !profile?.is_platform_admin) {
    return json({ error: "Forbidden" }, 403)
  }

  let body: { userId?: unknown; newPassword?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { userId, newPassword } = body
  if (typeof userId !== "string" || !userId || typeof newPassword !== "string" || !newPassword) {
    return json({ error: "userId und newPassword erforderlich." }, 400)
  }
  if (newPassword.length < 8) {
    return json({ error: "Passwort muss mindestens 8 Zeichen haben." }, 400)
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  if (updateError) return json({ error: updateError.message }, 500)

  return json({ success: true })
})
