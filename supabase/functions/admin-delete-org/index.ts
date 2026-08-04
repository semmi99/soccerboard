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

// Platform-admin-only: deletes an organization AND every member account in
// it. Deleting a member's auth user cascades to their profiles row (see
// 001_init.sql's `on delete cascade`), so members are removed first, then
// the now-empty organizations row itself.
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

  let body: { orgId?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  const { orgId } = body
  if (typeof orgId !== "string" || !orgId) {
    return json({ error: "orgId erforderlich." }, 400)
  }

  const { data: callerProfile, error: callerError } = await adminClient
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", userData.user.id)
    .single()
  if (callerError || !callerProfile?.is_platform_admin) return json({ error: "Forbidden" }, 403)

  const { data: members, error: membersError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("org_id", orgId)
  if (membersError) return json({ error: membersError.message }, 500)

  for (const member of members ?? []) {
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(member.id)
    if (deleteUserError) return json({ error: deleteUserError.message }, 500)
  }

  const { error: deleteOrgError } = await adminClient.from("organizations").delete().eq("id", orgId)
  if (deleteOrgError) return json({ error: deleteOrgError.message }, 500)

  return json({ success: true })
})
