/*
# Enable realtime for PropControl tables

Adds accounts, trades, and movements to the supabase_realtime publication
so the frontend can subscribe to row-level changes and sync across devices.
*/

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE trades;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE movements;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
