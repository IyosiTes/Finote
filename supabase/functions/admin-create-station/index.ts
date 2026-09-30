
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Missing required environment variables");
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  // Client scoped to the incoming user's JWT.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Verify the JWT with Supabase Auth.
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // Trusted server-side client.
  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  // Check that this authenticated user is an admin.
  const { data: admin, error: adminError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Admin lookup failed:", adminError.message);
    return jsonResponse({ error: "Unable to verify admin" }, 500);
  }

  if (!admin) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  // Parse and validate request body.
  let body: {
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { name, latitude, longitude } = body;

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 150
  ) {
    return jsonResponse(
      { error: "Name must be between 1 and 150 characters" },
      400,
    );
  }

  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return jsonResponse({ error: "Invalid latitude" }, 400);
  }

  if (
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return jsonResponse({ error: "Invalid longitude" }, 400);
  }

  // Atomic database operation initializes all services.
  const { data: stationId, error: createError } =
    await adminClient.rpc("create_station_with_services", {
      p_name: name.trim(),
      p_latitude: latitude,
      p_longitude: longitude,
    });

  if (createError) {
    console.error("Station creation failed:", createError.message);
    return jsonResponse({ error: "Could not create station" }, 500);
  }

  return jsonResponse({
    success: true,
    station_id: stationId,
  }, 201);
});
