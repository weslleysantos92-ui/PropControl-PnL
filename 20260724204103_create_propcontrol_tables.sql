/*
# Create PropControl tables (multi-user, owner-scoped)

## Overview
This migration creates the three core tables that power PropControl — accounts, trades, and financial movements.
Each row is owned by the authenticated user who created it, so data is private per user and syncs across all their devices.

## New Tables

### accounts
- `id` (uuid, primary key) — unique account identifier
- `user_id` (uuid, not null, defaults to the authenticated user) — owner
- `name` (text, not null) — operational name e.g. "Lucid 25K #01"
- `code` (text, not null) — official code e.g. "L-1029"
- `size` (text, not null) — one of '25K', '50K', '100K', '150K'
- `status` (text, not null) — one of 'Avaliacao', 'Financiada', 'Reprovada'
- `prop_firm` (text, not null) — prop firm name
- `queue_order` (int, not null, default 0) — ordering within status group
- `created_at` (bigint, not null) — creation timestamp in ms
- `funded_at` (bigint, nullable) — timestamp when account became funded

### trades
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to the authenticated user) — owner
- `account_id` (uuid, not null) — references accounts(id), cascade delete
- `asset` (text, not null) — one of 'MNQ', 'NQ', 'MGC', 'GC'
- `context` (text, not null) — trade context
- `timeframe` (text, not null) — one of 'M1', 'M5', 'M15'
- `result` (text, not null) — one of 'Take', 'Stop', 'BE'
- `amount` (numeric, not null) — financial result in USD
- `note` (text, nullable) — optional note
- `timestamp` (bigint, not null) — trade timestamp in ms

### movements
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to the authenticated user) — owner
- `type` (text, not null) — 'investimento' or 'saque'
- `amount` (numeric, not null) — amount in USD
- `description` (text, not null) — description
- `timestamp` (bigint, not null) — movement timestamp in ms

## Security (RLS)
- RLS enabled on all three tables.
- Each table has 4 owner-scoped policies (SELECT, INSERT, UPDATE, DELETE) scoped to `authenticated` users via `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so inserts from the client succeed even when the field is omitted.

## Important Notes
1. The `user_id DEFAULT auth.uid()` is critical — the frontend inserts without passing user_id, and the default fills it from the authenticated session.
2. `trades.account_id` has a foreign key to `accounts(id)` with `ON DELETE CASCADE` so deleting an account removes its trades.
3. Timestamps are stored as bigint (milliseconds) to match the existing frontend logic.
*/

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  size text NOT NULL CHECK (size IN ('25K', '50K', '100K', '150K')),
  status text NOT NULL CHECK (status IN ('Avaliacao', 'Financiada', 'Reprovada')),
  prop_firm text NOT NULL,
  queue_order int NOT NULL DEFAULT 0,
  created_at bigint NOT NULL,
  funded_at bigint
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_accounts" ON accounts;
CREATE POLICY "select_own_accounts" ON accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_accounts" ON accounts;
CREATE POLICY "insert_own_accounts" ON accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_accounts" ON accounts;
CREATE POLICY "update_own_accounts" ON accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_accounts" ON accounts;
CREATE POLICY "delete_own_accounts" ON accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset text NOT NULL CHECK (asset IN ('MNQ', 'NQ', 'MGC', 'GC')),
  context text NOT NULL,
  timeframe text NOT NULL CHECK (timeframe IN ('M1', 'M5', 'M15')),
  result text NOT NULL CHECK (result IN ('Take', 'Stop', 'BE')),
  amount numeric NOT NULL,
  note text,
  timestamp bigint NOT NULL
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trades" ON trades;
CREATE POLICY "select_own_trades" ON trades FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trades" ON trades;
CREATE POLICY "insert_own_trades" ON trades FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trades" ON trades;
CREATE POLICY "update_own_trades" ON trades FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trades" ON trades;
CREATE POLICY "delete_own_trades" ON trades FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('investimento', 'saque')),
  amount numeric NOT NULL,
  description text NOT NULL,
  timestamp bigint NOT NULL
);

ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_movements" ON movements;
CREATE POLICY "select_own_movements" ON movements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_movements" ON movements;
CREATE POLICY "insert_own_movements" ON movements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_movements" ON movements;
CREATE POLICY "update_own_movements" ON movements FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_movements" ON movements;
CREATE POLICY "delete_own_movements" ON movements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
