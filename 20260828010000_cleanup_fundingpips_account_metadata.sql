-- Keep only the account phase metadata needed by PropControl.
-- The reward split and model are chosen/managed outside the app and are not stored here.

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_model_check,
  DROP CONSTRAINT IF EXISTS accounts_reward_split_check;

ALTER TABLE accounts
  DROP COLUMN IF EXISTS model,
  DROP COLUMN IF EXISTS reward_split;

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_size_check;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_size_check
  CHECK (size IN ('5K', '10K', '25K', '50K', '100K', '150K'));
