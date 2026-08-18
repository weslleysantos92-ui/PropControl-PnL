/* PropControl — final trade field constraints.
   Assets are intentionally free text. Timeframes supported by the app are M1/M2/M3/M5/M15. */

ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_asset_check;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_timeframe_check;

ALTER TABLE trades
  ADD CONSTRAINT trades_timeframe_check
  CHECK (timeframe IN ('M1', 'M2', 'M3', 'M5', 'M15'));
