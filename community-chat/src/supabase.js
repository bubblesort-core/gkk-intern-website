
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = window.location.origin + '/supabase-chat';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bnB3dXhyYmFvdXNnd2dveWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODU2MzYsImV4cCI6MjA4MzU2MTYzNn0.dTM9rguaiuHbrr59iPUsM5znDzXhOdRXbPQ11yOfZpM';

export const supabase = createClient(supabaseUrl, supabaseKey, {
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
