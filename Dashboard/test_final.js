import { createClient } from '@supabase/supabase-js';

const url = 'https://gkkintern.in/supabase-main';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc1Mjk2MywiZXhwIjoyMDg0MzI4OTYzfQ.yMRMHo508iR6NixtBlG0E0ZGRwsYzteS5JdEw0pQ0Dw';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU';

const supabaseService = createClient(url, serviceKey);
const supabaseAnon = createClient(url, anonKey);

async function run() {
    console.log('--- ADMIN QUERY ---');
    const { data: adminData } = await supabaseService.from('teams').select('id, name, batch_id, batches(*)').limit(1);
    console.log('Admin Data:', JSON.stringify(adminData, null, 2));

    console.log('--- ANON QUERY ---');
    const { data: anonData, error: anonError } = await supabaseAnon.from('teams').select('id, name, batch_id, batches(*)').limit(1);
    console.log('Anon Data:', JSON.stringify(anonData, null, 2));
    if (anonError) console.error('Anon Error:', JSON.stringify(anonError));

    // Also query batches directly as anon
    console.log('--- ANON BATCHES DIRECT ---');
    const { data: directData, error: directError } = await supabaseAnon.from('batches').select('*').limit(1);
    console.log('Direct Anon batches:', JSON.stringify(directData, null, 2));
    if (directError) console.error('Direct Anon error:', JSON.stringify(directError));
}

run();
