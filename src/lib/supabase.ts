import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://hneizmytlvmpzeifhyyt.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZWl6bXl0bHZtcHplaWZoeXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTY3NTEsImV4cCI6MjEwNjA5Mjc1MX0.jRQ7dEfr-yMrs-_UhE-kKNI0zTbRyPH7i0izHksquRs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
