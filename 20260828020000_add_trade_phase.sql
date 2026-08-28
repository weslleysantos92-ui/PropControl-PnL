-- Associate every trade with the evaluation cycle in which it was recorded.
-- This keeps Phase 1, Phase 2 and Master calculations independent while
-- preserving the complete trade history.

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS phase int;

UPDATE trades t
SET phase = CASE
  WHEN a.status = 'Financiada' THEN 0
  ELSE 1
END
FROM accounts a
WHERE t.account_id = a.id
  AND t.phase IS NULL;

ALTER TABLE trades
  DROP CONSTRAINT IF EXISTS trades_phase_check;

ALTER TABLE trades
  ADD CONSTRAINT trades_phase_check
  CHECK (phase IN (0, 1, 2));

ALTER TABLE trades
  ALTER COLUMN phase SET DEFAULT 1;
