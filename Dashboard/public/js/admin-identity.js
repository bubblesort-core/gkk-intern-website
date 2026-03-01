document.addEventListener('DOMContentLoaded', () => {
    checkAdminIdentity();
});

function checkAdminIdentity() {
    // 1. Check if we already have a session identity
    const sessionIdentity = sessionStorage.getItem('admin_identity');

    if (sessionIdentity) {
        // We are good
        return;
    }

    // 2. If not, show blocking modal
    showIdentityModal();
}

function showIdentityModal() {
    // Create modal HTML
    const modalHtml = `
        <div id="identity-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
        ">
            <div style="
                background: #1e293b;
                border: 1px solid #334155;
                padding: 32px;
                border-radius: 16px;
                width: 100%;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            ">
                <div style="
                    width: 64px;
                    height: 64px;
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    margin: 0 auto 24px;
                ">
                    <i class="fas fa-user-shield"></i>
                </div>
                
                <h2 style="color: #f8fafc; margin: 0 0 8px 0; font-size: 20px;">Admin Identification</h2>
                <p style="color: #94a3b8; margin: 0 0 24px 0; font-size: 14px;">Please identify yourself to access the dashboard. This activity will be logged.</p>
                
                <form id="identity-form" onsubmit="handleIdentitySubmit(event)">
                    <div style="margin-bottom: 20px; text-align: left;">
                        <label style="display: block; color: #cbd5e1; font-size: 12px; font-weight: 500; margin-bottom: 6px;">Your Name</label>
                        <input type="text" id="admin-name-input" required placeholder="e.g. John Doe" style="
                            width: 100%;
                            background: #0f172a;
                            border: 1px solid #334155;
                            color: white;
                            padding: 10px 12px;
                            border-radius: 8px;
                            outline: none;
                            transition: border-color 0.2s;
                        " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#334155'">
                    </div>
                    
                    <button type="submit" style="
                        width: 100%;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    `;

    // Append to body
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    // Focus input
    setTimeout(() => {
        const input = document.getElementById('admin-name-input');
        if (input) input.focus();
    }, 100);
}

async function handleIdentitySubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('admin-name-input');
    const name = nameInput.value.trim();

    if (name.length < 2) {
        alert("Please enter a valid name.");
        return;
    }

    // 1. Save to Session Storage
    sessionStorage.setItem('admin_identity', name);

    // 2. Remove Modal
    const modal = document.getElementById('identity-modal');
    if (modal) modal.remove();

    // 3. Log to Database
    await logAdminAction(name, 'LOGIN', 'Admin accessed dashboard');
}

async function logAdminAction(adminName, action, details) {
    try {
        if (!window.supabaseClient) return;

        await window.supabaseClient.from('admin_logs').insert([{
            admin_name: adminName,
            action: action,
            details: details,
            user_agent: navigator.userAgent
        }]);
    } catch (err) {
        console.error('Failed to log admin action:', err);
    }
}
