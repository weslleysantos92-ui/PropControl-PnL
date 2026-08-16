/* PnL Global: remove legacy prop-firm field from accounts. */
ALTER TABLE accounts DROP COLUMN IF EXISTS prop_firm;
