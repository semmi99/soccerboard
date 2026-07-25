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

const VALID_ROLES = ["admin", "coach", "viewer"]

// Lets an org admin create a fully-usable teammate account immediately
// (with a password the admin sets, so no self-registration wait) instead
// of only being able to send an email invite. Rather than duplicating the
// org/role-assignment logic, this inserts a normal org_invites row for the
// email first, then creates the auth user — the existing
// private.handle_new_user() trigger (021_org_admin.sql) picks up that
// pending invite the moment the user row is inserted and creates the
// profile in the right org with the right role on its own, exactly as it
// already does for self-registered invitees. The service-role key only
// ever lives here; every request re-verifies the CALLER's own JWT and
// looks up their role/org_id directly in the database.
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

  let body: { email?: unknown; password?: unknown; fullName?: unknown; role?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  const { email, password, fullName, role } = body
  if (typeof email !== "string" || !email.trim()) {
    return json({ error: "E-Mail erforderlich." }, 400)
  }
  if (typeof password !== "string" || password.length < 8) {
    return json({ error: "Passwort muss mindestens 8 Zeichen haben." }, 400)
  }
  if (typeof role !== "string" || !VALID_ROLES.includes(role)) {
    return json({ error: "Ungültige Rolle." }, 400)
  }
  const cleanFullName = typeof fullName === "string" ? fullName.trim() : ""
  const cleanEmail = email.trim().toLowerCase()

  const { data: callerProfile, error: callerError } = await adminClient
    .from("profiles")
    .select("role, org_id, is_platform_admin")
    .eq("id", userData.user.id)
    .single()
  if (callerError || !callerProfile) return json({ error: "Forbidden" }, 403)
  if (callerProfile.role !== "admin" && !callerProfile.is_platform_admin) {
    return json({ error: "Forbidden" }, 403)
  }

  const { data: invite, error: inviteError } = await adminClient
    .from("org_invites")
    .insert({ org_id: callerProfile.org_id, email: cleanEmail, role, invited_by: userData.user.id })
    .select("id")
    .single()
  if (inviteError || !invite) {
    return json({ error: inviteError?.message ?? "Einladung konnte nicht angelegt werden." }, 500)
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: cleanFullName ? { full_name: cleanFullName } : undefined,
  })

  if (createError || !created.user) {
    await adminClient.from("org_invites").delete().eq("id", invite.id)
    return json({ error: createError?.message ?? "Benutzer konnte nicht angelegt werden." }, 500)
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", created.user.id)
    .single()
  if (profileError || !profile) {
    return json({ error: "Konto wurde angelegt, Profil konnte aber nicht geladen werden." }, 500)
  }

  return json({ profile })
})
