import { createClient } from '@supabase/supabase-js';

const supabaseUrl = window.location.origin + '/supabase-main';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    },
    global: {
        fetch: async (url, options) => {
            const response = await fetch(url, options);
            if (response.status === 429) {
                console.error('⚠️ SUPABASE RATE LIMIT EXCEEDED (429):', url);
            }
            return response;
        }
    }
});
