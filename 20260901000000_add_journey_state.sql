-- Persist the official Journey state independently from operational data.
-- This keeps the Journey start date and unlocked achievements historical even
-- if an account or trade is later removed from the operational tables.
CREATE TABLE IF NOT EXISTS journey_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at bigint,
  unlocked_achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  objective jsonb,
  updated_at bigint NOT NULL DEFAULT 0,
  CONSTRAINT journey_state_one_per_user UNIQUE (user_id)
);

ALTER TABLE journey_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_journey_state" ON journey_state;
CREATE POLICY "select_own_journey_state" ON journey_state FOR SELECT
  TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "insert_own_journey_state" ON journey_state;
CREATE POLICY "insert_own_journey_state" ON journey_state FOR INSERT
  TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "update_own_journey_state" ON journey_state;
CREATE POLICY "update_own_journey_state" ON journey_state FOR UPDATE
  TO authenticated USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_journey_state" ON journey_state;
CREATE POLICY "delete_own_journey_state" ON journey_state FOR DELETE
  TO authenticated USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS journey_state_user_id_idx ON journey_state(user_id);
