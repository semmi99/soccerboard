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

// Lets an org admin remove a member of their OWN organization (unlike
// admin-set-password, which is platform-admin-only and unscoped). The
// service-role key only ever lives here; every request re-verifies the
// CALLER's own JWT, looks up their profile's role and org_id directly in
// the database, and re-checks the TARGET's org_id matches — a client-
// supplied "I'm an admin of org X" claim is never trusted. Deleting the
// auth user cascades to the profiles row (see 001_init.sql's `on delete
// cascade`), so there's nothing else to clean up here.
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

  let body: { userId?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  const { userId } = body
  if (typeof userId !== "string" || !userId) {
    return json({ error: "userId erforderlich." }, 400)
  }
  if (userId === userData.user.id) {
    return json({ error: "Du kannst dich nicht selbst entfernen." }, 400)
  }

  const { data: callerProfile, error: callerError } = await adminClient
    .from("profiles")
    .select("role, org_id, is_platform_admin")
    .eq("id", userData.user.id)
    .single()
  if (callerError || !callerProfile) return json({ error: "Forbidden" }, 403)

  const isOrgAdmin = callerProfile.role === "admin"
  if (!isOrgAdmin && !callerProfile.is_platform_admin) {
    return json({ error: "Forbidden" }, 403)
  }

  const { data: targetProfile, error: targetError } = await adminClient
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .single()
  if (targetError || !targetProfile) return json({ error: "Benutzer nicht gefunden." }, 404)

  if (!callerProfile.is_platform_admin && targetProfile.org_id !== callerProfile.org_id) {
    return json({ error: "Forbidden" }, 403)
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteError) return json({ error: deleteError.message }, 500)

  return json({ success: true })
})
