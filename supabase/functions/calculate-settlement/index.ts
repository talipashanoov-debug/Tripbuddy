// Supabase Edge Function: calculate-settlement
// -------------------------------------------------
// Given a `trip_id`, this function:
//   1. Authenticates the caller and verifies they are a member of the trip.
//   2. Fetches all trip members and all expenses (server-side, trusted).
//   3. Splits the total cost equally and computes the minimal set of
//      payments ("who owes whom") needed to settle everyone up.
//
// Why an Edge Function and not client-side logic?
//   - The settlement is authoritative and identical for every member.
//   - It needs to read other users' emails via the service role, which
//     must never be exposed to the browser.
//
// Env vars (auto-injected by the Supabase platform):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Member {
  user_id: string;
}

interface Expense {
  amount: number | string;
  paid_by: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Round to 2 decimals (cents), avoiding binary float drift.
function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function calculateSettlement(
  members: Member[],
  expenses: Expense[],
  emailById: Map<string, string>,
  tripId: string,
) {
  const memberIds = members.map((m) => m.user_id);
  const n = memberIds.length;

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const share = n > 0 ? total / n : 0;

  // net = (what a member paid) - (their equal share).
  //   net > 0  → the group owes them (creditor)
  //   net < 0  → they owe the group (debtor)
  const net = new Map<string, number>();
  memberIds.forEach((id) => net.set(id, -share));

  for (const e of expenses) {
    // In this app paid_by is always a current member; guard just in case.
    if (net.has(e.paid_by)) {
      net.set(e.paid_by, net.get(e.paid_by)! + (Number(e.amount) || 0));
    }
  }
  memberIds.forEach((id) => net.set(id, round(net.get(id)!)));

  // Greedy min-cash-flow: match biggest debtor to biggest creditor.
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  for (const id of memberIds) {
    const value = net.get(id)!;
    if (value > 0.005) creditors.push({ id, amount: value });
    else if (value < -0.005) debtors.push({ id, amount: -value });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: {
    from_user_id: string;
    from_email: string;
    to_user_id: string;
    to_email: string;
    amount: number;
  }[] = [];

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = round(Math.min(debtors[i].amount, creditors[j].amount));
    if (pay > 0) {
      settlements.push({
        from_user_id: debtors[i].id,
        from_email: emailById.get(debtors[i].id) ?? "Unknown",
        to_user_id: creditors[j].id,
        to_email: emailById.get(creditors[j].id) ?? "Unknown",
        amount: pay,
      });
    }
    debtors[i].amount = round(debtors[i].amount - pay);
    creditors[j].amount = round(creditors[j].amount - pay);
    if (debtors[i].amount <= 0.005) i++;
    if (creditors[j].amount <= 0.005) j++;
  }

  return {
    trip_id: tripId,
    currency: "USD",
    total: round(total),
    per_person: round(share),
    member_count: n,
    balances: memberIds.map((id) => ({
      user_id: id,
      email: emailById.get(id) ?? "Unknown",
      net: net.get(id)!,
    })),
    settlements,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const { trip_id } = await req.json().catch(() => ({}));
    if (!trip_id) return json({ error: "trip_id is required" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Client acting AS the caller — respects RLS, used only to authorize.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    // 2. Verify caller is a member of this trip (RLS-enforced).
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

    // 3. Trusted service-role client — reads are now authorized.
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: members, error: membersError } = await adminClient
      .from("trip_members")
      .select("user_id")
      .eq("trip_id", trip_id);
    if (membersError) return json({ error: membersError.message }, 400);

    const { data: expenses, error: expensesError } = await adminClient
      .from("expenses")
      .select("amount, paid_by")
      .eq("trip_id", trip_id);
    if (expensesError) return json({ error: expensesError.message }, 400);

    // Resolve member emails for a human-readable settlement plan.
    const emailById = new Map<string, string>();
    for (const m of (members ?? []) as Member[]) {
      const { data } = await adminClient.auth.admin.getUserById(m.user_id);
      emailById.set(m.user_id, data?.user?.email ?? "Unknown");
    }

    const result = calculateSettlement(
      (members ?? []) as Member[],
      (expenses ?? []) as Expense[],
      emailById,
      trip_id,
    );

    return json(result, 200);
  } catch (err) {
    return json({ error: (err as Error)?.message ?? "Unexpected error" }, 500);
  }
});
