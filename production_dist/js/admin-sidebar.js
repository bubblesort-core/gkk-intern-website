document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Define Navigation Items
    const navItems = [
        { label: 'Overview', isLabel: true },
        { name: 'Dashboard', icon: 'fas fa-th-large', link: 'index.html' },

        { label: 'Management', isLabel: true },
        { name: 'Applications', icon: 'fas fa-file-alt', link: 'applications.html' },
        { name: 'Active Interns', icon: 'fas fa-user-check', link: 'active-interns.html' },
        { name: 'Batches', icon: 'fas fa-layer-group', link: 'batches.html' },
        { name: 'Modifications', icon: 'fas fa-tools', link: 'modifications.html' },
        { name: 'Availability', icon: 'fas fa-calendar-check', link: 'availability.html' },
        { name: 'Teams', icon: 'fas fa-users', link: 'teams.html' },
        { name: 'Projects', icon: 'fas fa-project-diagram', link: 'projects.html' },
        { name: 'Submissions', icon: 'fas fa-cloud-upload-alt', link: 'submissions.html' },
        { name: 'Rewards', icon: 'fas fa-gift', link: 'rewards.html' },
        { name: 'QR Codes', icon: 'fas fa-qrcode', link: 'qr-codes.html' },

        { label: 'Communication', isLabel: true },
        { name: 'Invitations', icon: 'fas fa-envelope', link: 'invitations.html' },
        { name: 'Announcements', icon: 'fas fa-bullhorn', link: 'announcements.html' },
        { name: 'Resources', icon: 'fas fa-book', link: 'resources.html' },
        { name: 'Sessions & Recordings', icon: 'fas fa-video', link: 'sessions.html' },

        { name: 'Custom Email', icon: 'fas fa-paper-plane', link: 'custom-email.html' },
        { name: 'Push Notifications', icon: 'fas fa-bell', link: 'custom-notifications.html' },

        { label: 'Finance', isLabel: true },
        { name: 'Payments', icon: 'fas fa-rupee-sign', link: 'payments.html' },

        { label: 'System', isLabel: true },
        { name: 'Activity Logs', icon: 'fas fa-history', link: 'logs.html' }
    ];

    // Get current page filename
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';

    // Build HTML
    let navHtml = '';
    navItems.forEach(item => {
        if (item.isLabel) {
            navHtml += `<div class="nav-group-label" style="margin-top: 24px;">${item.label}</div>`;
        } else {
            // Handle consistent highlighting
            let isActive = currentPage === item.link;

            // Special cases if any (e.g. sub-pages)
            if (currentPage === '' && item.link === 'index.html') isActive = true;

            navHtml += `
            <a href="${item.link}" class="nav-link ${isActive ? 'active' : ''}">
                <i class="${item.icon}"></i> ${item.name}
            </a>`;
        }
    });

    // Add Main Page Link at the bottom
    navHtml += `
        <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 16px 0;"></div>
        <a href="../index.html" class="nav-link">
            <i class="fas fa-arrow-left"></i> Main Page
        </a>
    `;

    const sidebarContent = `
        <div class="sidebar-header">
            <div class="logo-text">
                <img src="../assets/gkk-intern-logo.png" alt="GKK Interns" style="height: 60px; width: auto; vertical-align: middle;">
            </div>
        </div>

        <nav class="sidebar-nav">
            ${navHtml}
        </nav>

        <div class="sidebar-footer">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.02);">
                <div style="width: 36px; height: 36px; background: #334155; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #f8fafc; flex-shrink: 0; border: 2px solid rgba(148, 163, 184, 0.2); overflow: hidden;">
                    A
                </div>
                <div style="flex: 1; overflow: hidden; cursor: default;">
                    <div style="font-weight: 600; font-size: 0.9rem; color: var(--c-text-primary);" id="sidebarUserName">Admin</div>
                    <div style="font-size: 0.75rem; color: var(--c-text-muted);">Administrator</div>
                </div>
            </div>
            <button class="btn-signout" onclick="signOut()" title="Sign Out">
                <i class="fas fa-sign-out-alt"></i>
                <span>Sign Out</span>
            </button>
        </div>
    `;

    sidebar.innerHTML = sidebarContent;

    // Update username if available in session
    const checkSession = () => {
        const session = localStorage.getItem('admin_session');
        if (session) {
            try {
                const data = JSON.parse(session);
                const userEl = document.getElementById('sidebarUserName');
                if (userEl) {
                    if (data.displayName) userEl.textContent = data.displayName;
                    else if (data.username) userEl.textContent = data.username;
                }

                // Also update the letter avatar if possible, though 'A' is fine default
                // const avatarEl = document.querySelector('.sidebar-footer .rounded-full');
            } catch (e) { }
        }
    };
    checkSession();
});
