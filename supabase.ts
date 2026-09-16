import { createClient } from '@supabase/supabase-js';

// Fallbacks inofensivos evitam que createClient lance erro (tela branca) quando as
// variáveis de ambiente do Supabase não estão configuradas — ex.: no Preview sem login.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-placeholder-key';

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'propcontrol_auth',
  },
});
