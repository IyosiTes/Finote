
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    console.error("Missing server configuration");
    return respond({ error: "Server configuration error" }, 500);
  }

  let body: {
    token?: unknown;
    station_fuel_id?: unknown;
    availability?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid JSON body" }, 400);
  }

  const { token, station_fuel_id, availability } = body;

  if (
    typeof token !== "string" ||
    token.length < 40 ||
    token.length > 200
  ) {
    return respond({ error: "Invalid manager token" }, 400);
  }

  if (
    typeof station_fuel_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(station_fuel_id)
  ) {
    return respond({ error: "Invalid service ID" }, 400);
  }

  if (
    availability !== "available" &&
    availability !== "unavailable" &&
    availability !== "unknown"
  ) {
    return respond({ error: "Invalid availability" }, 400);
  }

  const adminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Hash the raw bearer token; never store or log it.
  const tokenHash = await sha256Hex(token);

  // Find the active manager link.
  const { data: link, error: linkError } = await adminClient
    .from("manager_links")
    .select("id")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .maybeSingle();

  if (linkError) {
    console.error("Manager link lookup failed:", linkError.message);
    return respond({ error: "Unable to validate manager link" }, 500);
  }

  if (!link) {
    return respond({ error: "Invalid or revoked manager link" }, 401);
  }

  // Database function revalidates the link under lock and
  // atomically updates current state plus audit history.
  const { data: result, error: updateError } =
    await adminClient.rpc("record_manager_fuel_update", {
      p_manager_link_id: link.id,
      p_station_fuel_id: station_fuel_id,
      p_new_availability: availability,
    });

  if (updateError) {
    const message = updateError.message ?? "";

    if (
      message.includes("invalid or revoked") ||
      message.includes("Service not found")
    ) {
      return respond({ error: "Invalid link or service" }, 400);
    }

    if (message.includes("Invalid availability")) {
      return respond({ error: "Invalid availability" }, 400);
    }

    console.error("Availability update failed:", message);
    return respond({ error: "Could not update availability" }, 500);
  }

  return respond({
    success: true,
    changed: result.changed,
    availability: result.availability,
  });
});
