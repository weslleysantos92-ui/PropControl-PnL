-- FundingPips 2 Step Flex account metadata and supported sizes.
-- Existing rows are kept compatible; new accounts can store the selected model and reward split.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS phase int,
  ADD COLUMN IF NOT EXISTS reward_split int;

UPDATE accounts
SET model = COALESCE(model, '2 Step Flex')
WHERE model IS NULL;

UPDATE accounts
SET phase = COALESCE(phase, CASE WHEN status = 'Financiada' THEN 0 ELSE 1 END)
WHERE phase IS NULL;

UPDATE accounts
SET reward_split = COALESCE(reward_split, 85)
WHERE reward_split IS NULL;

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_size_check;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_size_check
  CHECK (size IN ('5K', '10K', '25K', '50K', '100K', '150K'));

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_model_check;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_model_check
  CHECK (model IS NULL OR model IN ('2 Step Flex'));

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_phase_check;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_phase_check
  CHECK (phase IS NULL OR phase IN (0, 1, 2));

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_reward_split_check;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_reward_split_check
  CHECK (reward_split IS NULL OR reward_split IN (85, 95));
