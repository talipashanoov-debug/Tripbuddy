// Supabase Edge Function: calculate-settlement
// -------------------------------------------------
// Given a `trip_id`, splits EACH expense equally among the participants
// selected for that expense, then computes the minimal set of payments
// ("who owes whom") to settle everyone up.
//
//   - Each expense is credited to its `paid_by_participant`.
//   - Each expense is split only among the participants linked to it via
//     `expense_participants`.
//   - Balances/settlements are keyed by participant (named people), NOT users.
//
// Authorization still uses trip_members + the caller's JWT: only a member of
// the trip may run it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Participant {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: number | string;
  paid_by_participant: string | null;
}

interface Link {
  expense_id: string;
  participant_id: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function calculateSettlement(
  participants: Participant[],
  expenses: Expense[],
  links: Link[],
  tripId: string,
) {
  const nameById = new Map<string, string>();
  participants.forEach((p) => nameById.set(p.id, p.name));

  // Group participant ids by expense.
  const sharersByExpense = new Map<string, string[]>();
  for (const link of links) {
    if (!sharersByExpense.has(link.expense_id)) {
      sharersByExpense.set(link.expense_id, []);
    }
    sharersByExpense.get(link.expense_id)!.push(link.participant_id);
  }

  const net = new Map<string, number>();
  participants.forEach((p) => net.set(p.id, 0));

  let total = 0;
  for (const e of expenses) {
    const amount = Number(e.amount) || 0;
    const sharers = (sharersByExpense.get(e.id) ?? []).filter((id) => net.has(id));
    if (sharers.length === 0) continue; // can't split with nobody
    total += amount;

    // Credit the payer for the full amount.
    if (e.paid_by_participant && net.has(e.paid_by_participant)) {
      net.set(e.paid_by_participant, net.get(e.paid_by_participant)! + amount);
    }
    // Debit each sharer their equal slice.
    const slice = amount / sharers.length;
    for (const id of sharers) {
      net.set(id, net.get(id)! - slice);
    }
  }

  participants.forEach((p) => net.set(p.id, round(net.get(p.id)!)));

  // Greedy min-cash-flow: biggest debtor pays biggest creditor.
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  for (const p of participants) {
    const value = net.get(p.id)!;
    if (value > 0.005) creditors.push({ id: p.id, amount: value });
    else if (value < -0.005) debtors.push({ id: p.id, amount: -value });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: {
    from_participant_id: string;
    from_name: string;
    to_participant_id: string;
    to_name: string;
    amount: number;
  }[] = [];

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = round(Math.min(debtors[i].amount, creditors[j].amount));
    if (pay > 0) {
      settlements.push({
        from_participant_id: debtors[i].id,
        from_name: nameById.get(debtors[i].id) ?? "?",
        to_participant_id: creditors[j].id,
        to_name: nameById.get(creditors[j].id) ?? "?",
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
    participant_count: participants.length,
    balances: participants.map((p) => ({
      participant_id: p.id,
      name: p.name,
      net: net.get(p.id)!,
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

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: participants, error: pErr } = await adminClient
      .from("participants")
      .select("id, name")
      .eq("trip_id", trip_id);
    if (pErr) return json({ error: pErr.message }, 400);

    const { data: expenses, error: eErr } = await adminClient
      .from("expenses")
      .select("id, amount, paid_by_participant")
      .eq("trip_id", trip_id);
    if (eErr) return json({ error: eErr.message }, 400);

    const expenseIds = (expenses ?? []).map((e) => e.id);
    let links: Link[] = [];
    if (expenseIds.length > 0) {
      const { data: linkRows, error: lErr } = await adminClient
        .from("expense_participants")
        .select("expense_id, participant_id")
        .in("expense_id", expenseIds);
      if (lErr) return json({ error: lErr.message }, 400);
      links = (linkRows ?? []) as Link[];
    }

    const result = calculateSettlement(
      (participants ?? []) as Participant[],
      (expenses ?? []) as Expense[],
      links,
      trip_id,
    );

    return json(result, 200);
  } catch (err) {
    return json({ error: (err as Error)?.message ?? "Unexpected error" }, 500);
  }
});
