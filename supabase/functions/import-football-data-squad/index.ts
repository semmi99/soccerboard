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

const API_BASE = "https://api.football-data.org/v4"

interface FdCompetitionsResponse {
  competitions: { code: string; name: string; emblem: string | null; area: { name: string } }[]
}

interface FdTeamsResponse {
  teams: { id: number; name: string; crest: string | null }[]
}

interface FdTeamResponse {
  id: number
  name: string
  crest: string | null
  squad: {
    id: number
    name: string
    position: string | null
    shirtNumber: number | null
  }[]
}

// Same provider-boundary pattern as import-api-football-squad: only this
// file knows football-data.org's shapes/auth, the frontend deals in the
// same neutral team/player shape either provider produces. Kept as a
// separate function (instead of a third action bolted onto the API-Football
// one) since the two providers have nothing in common beyond "football data"
// — different auth header, base URL, and response shape.
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
    .select("role")
    .eq("id", userData.user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    return json({ error: "Forbidden" }, 403)
  }

  const token = Deno.env.get("FOOTBALL_DATA_TOKEN")
  if (!token) return json({ error: "FOOTBALL_DATA_TOKEN is not configured" }, 500)

  let body: { action?: unknown; competitionCode?: unknown; teamId?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  async function fdFetch(path: string) {
    const res = await fetch(`${API_BASE}${path}`, { headers: { "X-Auth-Token": token! } })
    if (res.status === 429) {
      return { error: json({ error: "football-data.org-Tageslimit erreicht. Bitte später erneut versuchen." }, 429) }
    }
    if (!res.ok) return { error: json({ error: `football-data.org error (${res.status})` }, 502) }
    return { data: res }
  }

  if (body.action === "competitions") {
    const { data: res, error } = await fdFetch("/competitions")
    if (error) return error
    const data = (await res!.json()) as FdCompetitionsResponse
    return json({
      competitions: data.competitions.map((c) => ({
        code: c.code,
        name: c.name,
        area: c.area.name,
        emblemUrl: c.emblem,
      })),
    })
  }

  if (body.action === "teams") {
    if (typeof body.competitionCode !== "string" || !body.competitionCode.trim()) {
      return json({ error: "competitionCode erforderlich." }, 400)
    }
    const { data: res, error } = await fdFetch(`/competitions/${body.competitionCode}/teams`)
    if (error) return error
    const data = (await res!.json()) as FdTeamsResponse
    return json({
      teams: data.teams.map((t) => ({ id: t.id, name: t.name, crestUrl: t.crest })),
    })
  }

  if (body.action === "team") {
    if (typeof body.teamId !== "number") {
      return json({ error: "teamId erforderlich." }, 400)
    }
    const { data: res, error } = await fdFetch(`/teams/${body.teamId}`)
    if (error) return error
    const data = (await res!.json()) as FdTeamResponse
    return json({
      team: { id: data.id, name: data.name, crestUrl: data.crest },
      players: data.squad.map((p) => ({
        apiPlayerId: p.id,
        name: p.name,
        number: p.shirtNumber,
        position: p.position,
      })),
    })
  }

  return json({ error: "Unknown action" }, 400)
})
