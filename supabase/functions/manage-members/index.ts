// Supabase Edge Function: manage-members
// -------------------------------------------------
// Two actions on a trip's membership, both requiring the caller to be a
// member of the trip:
//
//   { trip_id, action: "list" }
//     → returns every member with their email + role, plus the trip's creator.
//
//   { trip_id, action: "invite", identifier }
//     → (creator only) resolves `identifier` (an email OR a user id) to a
//       user and adds them to trip_members.
//
// Why an Edge Function?
//   - Listing members needs to read OTHER users' emails (auth.users), which
//     requires the service role and must never reach the browser.
//   - Inviting must insert a trip_members row for a *different* user, which
//     the browser's RLS policy (user_id = auth.uid()) intentionally forbids.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// deno-lint-ignore no-explicit-any
async function findUserByEmail(admin: any, email: string) {
  // Small projects: a single large page is plenty. Scale to pagination later.
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  const target = email.toLowerCase();
  // deno-lint-ignore no-explicit-any
  return data.users.find((u: any) => (u.email ?? "").toLowerCase() === target) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const { trip_id, action, identifier } = await req.json().catch(() => ({}));
    if (!trip_id) return json({ error: "trip_id is required" }, 400);
    if (action !== "list" && action !== "invite") {
      return json({ error: "action must be 'list' or 'invite'" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Caller-scoped client (RLS) — used only to authenticate + authorize.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: membership, error: membershipError } = await userClient
      .from("trip_members")
      .select("id")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membershipError) return json({ error: membershipError.message }, 400);
    if (!membership) {
      return json({ error: "Forbidden: you are not a member of this trip." }, 403);
    }

    // Trusted service-role client.
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: trip, error: tripError } = await adminClient
      .from("trips")
      .select("created_by")
      .eq("id", trip_id)
      .single();
    if (tripError) return json({ error: tripError.message }, 400);

    // ---- LIST ------------------------------------------------------------
    if (action === "list") {
      const { data: rows, error: rowsError } = await adminClient
        .from("trip_members")
        .select("user_id, role")
        .eq("trip_id", trip_id);
      if (rowsError) return json({ error: rowsError.message }, 400);

      const members = [];
      for (const row of rows ?? []) {
        const { data } = await adminClient.auth.admin.getUserById(row.user_id);
        members.push({
          user_id: row.user_id,
          email: data?.user?.email ?? "Unknown",
          role: row.role ?? "member",
        });
      }

      return json({ members, created_by: trip.created_by }, 200);
    }

    // ---- INVITE ----------------------------------------------------------
    if (user.id !== trip.created_by) {
      return json({ error: "Only the trip creator can invite members." }, 403);
    }

    const value = (identifier ?? "").trim();
    if (!value) return json({ error: "Enter an email or user ID." }, 400);

    let targetId: string;
    if (isEmail(value)) {
      const found = await findUserByEmail(adminClient, value);
      if (!found) {
        return json(
          { error: "No user with that email. They must sign up first." },
          404,
        );
      }
      targetId = found.id;
    } else if (isUuid(value)) {
      const { data } = await adminClient.auth.admin.getUserById(value);
      if (!data?.user) return json({ error: "No user with that ID." }, 404);
      targetId = value;
    } else {
      return json({ error: "Enter a valid email or user ID." }, 400);
    }

    // Already a member? Report it rather than erroring on the unique constraint.
    const { data: existing } = await adminClient
      .from("trip_members")
      .select("id")
      .eq("trip_id", trip_id)
      .eq("user_id", targetId)
      .maybeSingle();

    const { data: targetUser } = await adminClient.auth.admin.getUserById(targetId);
    const email = targetUser?.user?.email ?? "Unknown";

    if (existing) {
      return json({ user_id: targetId, email, role: "member", already: true }, 200);
    }

    const { error: insertError } = await adminClient
      .from("trip_members")
      .insert({ trip_id, user_id: targetId, role: "member" });
    if (insertError) return json({ error: insertError.message }, 400);

    return json({ user_id: targetId, email, role: "member", already: false }, 200);
  } catch (err) {
    return json({ error: (err as Error)?.message ?? "Unexpected error" }, 500);
  }
});
