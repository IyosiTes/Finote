
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

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

  let body: { station_id?: unknown; fuel_type_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (typeof body.station_id !== "string" || !uuid.test(body.station_id) ||
      typeof body.fuel_type_id !== "string" || !uuid.test(body.fuel_type_id)) {
    return json({ error: "Invalid station_id or fuel_type_id" }, 400);
  }

  const { data: serviceId, error } = await db.rpc("add_station_service", {
    p_station_id: body.station_id,
    p_fuel_type_id: body.fuel_type_id,
  });

  if (error) {
    console.error("Add service failed:", error.message);
    if (error.message.includes("not found")) {
      return json({ error: "Station or fuel type not found" }, 404);
    }
    return json({ error: "Could not add service" }, 500);
  }

  return json({ success: true, station_fuel_id: serviceId }, 201);
});