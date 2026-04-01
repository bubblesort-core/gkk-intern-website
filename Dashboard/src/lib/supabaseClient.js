import { createClient } from '@supabase/supabase-js';

const supabaseUrl = window.location.origin + '/supabase-main';
const supabaseDirectUrl = 'https://hjpsyxqakzrhvzegehtm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseDirectUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});
