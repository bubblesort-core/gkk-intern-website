
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjpsyxqakzrhvzegehtm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('applications').select('*').limit(5);
    if (error) {
        console.error(error);
    } else {
        console.log('Sample applications:', data);
    }
}

checkSchema();
