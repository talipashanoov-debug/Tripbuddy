-- ============================================================
-- TripBuddy — Participants & per-expense splitting
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- 1. Participants: named people on a trip (do NOT need an app account).
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- 2. Which participants share a given expense (many-to-many).
create table if not exists expense_participants (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  unique (expense_id, participant_id)
);

-- 3. Record WHICH PARTICIPANT paid. (The old paid_by → auth.users stays as an
--    audit of who *logged* the expense, but is no longer required.)
alter table expenses add column if not exists paid_by_participant uuid references participants(id);
alter table expenses alter column paid_by drop not null;

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table participants enable row level security;
alter table expense_participants enable row level security;

-- Participants: any member of the trip may read/manage them.
create policy "read trip participants" on participants for select
  using (trip_id in (select trip_id from trip_members where user_id = auth.uid()));
create policy "insert trip participants" on participants for insert
  with check (trip_id in (select trip_id from trip_members where user_id = auth.uid()));
create policy "delete trip participants" on participants for delete
  using (trip_id in (select trip_id from trip_members where user_id = auth.uid()));

-- Expense↔participant links: allowed when the expense belongs to one of the
-- user's trips.
create policy "read expense participants" on expense_participants for select
  using (
    expense_id in (
      select e.id from expenses e
      join trip_members m on m.trip_id = e.trip_id
      where m.user_id = auth.uid()
    )
  );
create policy "insert expense participants" on expense_participants for insert
  with check (
    expense_id in (
      select e.id from expenses e
      join trip_members m on m.trip_id = e.trip_id
      where m.user_id = auth.uid()
    )
  );
create policy "delete expense participants" on expense_participants for delete
  using (
    expense_id in (
      select e.id from expenses e
      join trip_members m on m.trip_id = e.trip_id
      where m.user_id = auth.uid()
    )
  );
