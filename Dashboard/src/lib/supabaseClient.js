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
    },
    global: {
        fetch: async (url, options) => {
            // Re-route REST/Auth calls through the proxy
            const fetchUrl = url.toString().replace(supabaseDirectUrl, supabaseUrl);
            const response = await fetch(fetchUrl, options);
            if (response.status === 429) {
                console.error('⚠️ SUPABASE RATE LIMIT EXCEEDED (429):', fetchUrl);
            }
            return response;
        }
    }
});
