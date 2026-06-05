import fetch from 'node-fetch';

async function testEmail() {
    const res = await fetch('https://hjpsyxqakzrhvzegehtm.supabase.co/functions/v1/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU'
        },
        body: JSON.stringify({
            to: 'test@example.com',
            subject: 'Test Subject',
            text: 'Test Text',
            html: '<p>Test HTML</p>'
        })
    });
    
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
}

testEmail().catch(console.error);
