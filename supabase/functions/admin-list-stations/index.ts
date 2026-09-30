
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return json({ error: "Server configuration error" }, 500);

  const userDb = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } = await userDb.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const db = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: admin, error: adminError } = await db
    .from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();

  if (adminError) {
    console.error("Admin lookup failed:", adminError.message);
    return json({ error: "Unable to verify admin" }, 500);
  }
  if (!admin) return json({ error: "Forbidden" }, 403);

  const { data, error } = await db
    .from("stations")
    .select(`
      id, name, latitude, longitude, status, created_at, updated_at,
      station_fuels (
        id, availability, updated_at,
        fuel_types (id, name)
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Station list failed:", error.message);
    return json({ error: "Could not load stations" }, 500);
  }

  return json({ success: true, stations: data ?? [] });
});