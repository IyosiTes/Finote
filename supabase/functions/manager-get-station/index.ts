
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Server configuration error" }, 500);

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (typeof body.token !== "string" ||
      body.token.length < 40 || body.token.length > 200) {
    return json({ error: "Invalid manager token" }, 400);
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tokenHash = await sha256Hex(body.token);

  const { data: link, error: linkError } = await db
    .from("manager_links")
    .select("id, station_id")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .maybeSingle();

  if (linkError) {
    console.error("Manager lookup failed:", linkError.message);
    return json({ error: "Unable to validate manager link" }, 500);
  }
  if (!link) return json({ error: "Invalid or revoked manager link" }, 401);

  const { data: station, error: stationError } = await db
    .from("stations")
    .select("id, name, status")
    .eq("id", link.station_id)
    .maybeSingle();

  if (stationError) {
    console.error("Station lookup failed:", stationError.message);
    return json({ error: "Unable to load station" }, 500);
  }
  if (!station) return json({ error: "Station not found" }, 404);

  const { data: services, error: servicesError } = await db
    .from("station_fuels")
    .select("id, availability, updated_at, fuel_types(id, name)")
    .eq("station_id", link.station_id)
    .order("created_at", { ascending: true });

  if (servicesError) {
    console.error("Service lookup failed:", servicesError.message);
    return json({ error: "Unable to load services" }, 500);
  }

  return json({
    success: true,
    station,
    services: (services ?? []).map((row) => ({
      id: row.id,
      availability: row.availability,
      updated_at: row.updated_at,
      fuel_type: row.fuel_types,
    })),
  });
});