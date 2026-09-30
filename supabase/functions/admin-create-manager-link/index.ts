
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return respond({ error: "Unauthorized" }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appUrl = Deno.env.get("APP_BASE_URL");

  if (!url || !anonKey || !serviceKey || !appUrl) {
    console.error("Missing environment configuration");
    return respond({ error: "Server configuration error" }, 500);
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } =
    await userClient.auth.getUser();

  if (authError || !user) {
    return respond({ error: "Unauthorized" }, 401);
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: admin, error: adminError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Admin lookup failed:", adminError.message);
    return respond({ error: "Unable to verify admin" }, 500);
  }

  if (!admin) return respond({ error: "Forbidden" }, 403);

  let body: { station_id?: unknown };

  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid JSON body" }, 400);
  }

  if (
    typeof body.station_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(body.station_id)
  ) {
    return respond({ error: "Invalid station_id" }, 400);
  }

  // 32 random bytes = 256 bits of token entropy.
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64Url(randomBytes);
  const tokenHash = await sha256Hex(token);

  const { data: linkId, error: rotateError } =
    await adminClient.rpc("rotate_manager_link", {
      p_station_id: body.station_id,
      p_token_hash: tokenHash,
    });

  if (rotateError) {
    console.error("Link creation failed:", rotateError.message);
    return respond({ error: "Could not create manager link" }, 500);
  }

  const base = appUrl.replace(/\/+$/, "");
  const managerUrl =
    `${base}/manage/${encodeURIComponent(token)}`;

  return respond({
    success: true,
    manager_link_id: linkId,
    manager_url: managerUrl,
  }, 201);
});