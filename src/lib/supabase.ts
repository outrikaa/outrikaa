import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://xvvudzbcxqntkyfdonqj.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dnVkemJjeXFudGt5ZmRvbnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDMwMTcsImV4cCI6MjEwNjA3OTAxN30.tUEsRK5rJxss3a3rGbWDFmXQ6hAq7r0ah2la78SyhZc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
