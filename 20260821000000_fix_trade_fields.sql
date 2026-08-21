/* PropControl — restore dynamic trade fields in the live database.
   Assets are free text. Timeframes supported by the app: M1/M2/M3/M5/M15.
   This migration is intentionally idempotent so it can be applied to an existing database.
*/

ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_asset_check;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_timeframe_check;

ALTER TABLE trades
  ADD CONSTRAINT trades_timeframe_check
  CHECK (timeframe IN ('M1', 'M2', 'M3', 'M5', 'M15'));
