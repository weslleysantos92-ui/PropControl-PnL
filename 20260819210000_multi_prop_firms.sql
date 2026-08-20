/* Multi-prop architecture: firms -> programs -> phase rules. */
CREATE TABLE IF NOT EXISTS prop_firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_official boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

CREATE TABLE IF NOT EXISTS prop_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE prop_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_prop_firms" ON prop_firms;
CREATE POLICY "select_own_prop_firms" ON prop_firms FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_prop_firms" ON prop_firms;
CREATE POLICY "insert_own_prop_firms" ON prop_firms FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_prop_firms" ON prop_firms;
CREATE POLICY "update_own_prop_firms" ON prop_firms FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_prop_firms" ON prop_firms;
CREATE POLICY "delete_own_prop_firms" ON prop_firms FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_prop_programs" ON prop_programs;
CREATE POLICY "select_own_prop_programs" ON prop_programs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_prop_programs" ON prop_programs;
CREATE POLICY "insert_own_prop_programs" ON prop_programs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_prop_programs" ON prop_programs;
CREATE POLICY "update_own_prop_programs" ON prop_programs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_prop_programs" ON prop_programs;
CREATE POLICY "delete_own_prop_programs" ON prop_programs FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS prop_program_id uuid REFERENCES prop_programs(id) ON DELETE SET NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS current_phase integer NOT NULL DEFAULT 1;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS rules_snapshot jsonb;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS prop_firm_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS prop_program_name text;

CREATE INDEX IF NOT EXISTS idx_prop_programs_firm_id ON prop_programs(firm_id);
CREATE INDEX IF NOT EXISTS idx_accounts_prop_program_id ON accounts(prop_program_id);
