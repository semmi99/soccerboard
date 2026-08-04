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

// Deactivates ("bans") or reactivates a user — same dual permission model as
// org-remove-member: a platform admin can target anyone, an org admin only
// members of their OWN org. Banning is enforced by Supabase Auth itself
// (banned_until on auth.users, via the service-role admin API), which
// refuses login/token-refresh outright; profiles.disabled is just a mirror
// of that state so the client can show/toggle it without service-role
// access. The service-role key only ever lives here.
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

  let body: { userId?: unknown; disabled?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  const { userId, disabled } = body
  if (typeof userId !== "string" || !userId || typeof disabled !== "boolean") {
    return json({ error: "userId und disabled erforderlich." }, 400)
  }
  if (userId === userData.user.id) {
    return json({ error: "Du kannst dich nicht selbst deaktivieren." }, 400)
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

  const { error: banError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: disabled ? "876000h" : "none",
  })
  if (banError) return json({ error: banError.message }, 500)

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({ disabled })
    .eq("id", userId)
  if (profileUpdateError) return json({ error: profileUpdateError.message }, 500)

  return json({ success: true })
})
