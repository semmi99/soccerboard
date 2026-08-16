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

const API_BASE = "https://v3.football.api-sports.io"

interface ApiFootballTeamsResponse {
  response: { team: { id: number; name: string; country: string; logo: string } }[]
}

interface ApiFootballSquadsResponse {
  response: {
    team: { id: number; name: string }
    players: { id: number; name: string; number: number | null; position: string | null; photo: string | null }[]
  }[]
}

// Lets an org admin search API-Football for a real team and pull its squad
// — used to drop a recognizable pro roster onto the board for promo
// videos, not for day-to-day club-roster management. The API-Football key
// only ever lives here (server-side Edge Function env), never in the
// client bundle. Every request re-verifies the CALLER's own JWT and looks
// up their profile's role directly in the database — a client-supplied
// "I'm an admin" claim is never trusted.
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

  const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY")
  if (!apiFootballKey) return json({ error: "API_FOOTBALL_KEY is not configured" }, 500)

  let body: { action?: unknown; query?: unknown; teamId?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  if (body.action === "search") {
    if (typeof body.query !== "string" || !body.query.trim()) {
      return json({ error: "query erforderlich." }, 400)
    }
    const res = await fetch(`${API_BASE}/teams?search=${encodeURIComponent(body.query)}`, {
      headers: { "x-apisports-key": apiFootballKey },
    })
    if (res.status === 429) return json({ error: "API-Football-Tageslimit erreicht. Bitte später erneut versuchen." }, 429)
    if (!res.ok) return json({ error: `API-Football error (${res.status})` }, 502)
    const data = (await res.json()) as ApiFootballTeamsResponse
    return json({
      teams: data.response.map((t) => ({
        id: t.team.id,
        name: t.team.name,
        country: t.team.country,
        logoUrl: t.team.logo,
      })),
    })
  }

  if (body.action === "squad") {
    if (typeof body.teamId !== "number") {
      return json({ error: "teamId erforderlich." }, 400)
    }
    const res = await fetch(`${API_BASE}/players/squads?team=${body.teamId}`, {
      headers: { "x-apisports-key": apiFootballKey },
    })
    if (res.status === 429) return json({ error: "API-Football-Tageslimit erreicht. Bitte später erneut versuchen." }, 429)
    if (!res.ok) return json({ error: `API-Football error (${res.status})` }, 502)
    const data = (await res.json()) as ApiFootballSquadsResponse
    const players = data.response[0]?.players ?? []
    return json({
      players: players.map((p) => ({
        apiPlayerId: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
        photoUrl: p.photo,
      })),
    })
  }

  return json({ error: "Unknown action" }, 400)
})
