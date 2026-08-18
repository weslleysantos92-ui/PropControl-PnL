/*
  PropControl — allow dynamic trade assets and the expanded timeframe set.
  Assets are intentionally free text so each trader can operate any market.
*/

ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_asset_check;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_timeframe_check;

ALTER TABLE trades
  ADD CONSTRAINT trades_timeframe_check
  CHECK (timeframe IN ('M1', 'M2', 'M3', 'M5', 'M15'));
