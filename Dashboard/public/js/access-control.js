/**
 * access-control.js
 * Enforces admin locks on specific pages or features.
 * Should be included in all intern-facing pages.
 */

(async function () {
    // Wait for Supabase to be available
    const waitForSupabase = () => new Promise(resolve => {
        if (window.supabaseClient) return resolve();
        const interval = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });

    await waitForSupabase();

    async function checkAccess() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return; // Not logged in, let login logic handle it or public page

            // Fetch active locks for this user or global
            const { data: locks, error } = await supabaseClient
                .from('access_controls')
                .select('page_identifier, reason')
                .eq('is_locked', true)
                .or(`target_user_id.eq.${user.id},target_user_id.is.null`);

            if (error) {
                console.error('Access control check failed:', error);
                return;
            }

            if (!locks || locks.length === 0) return;

            // map of locked pages
            const lockedPages = locks.reduce((acc, lock) => {
                acc[lock.page_identifier] = lock.reason;
                return acc;
            }, {});

            handleLocks(lockedPages);

        } catch (err) {
            console.error('Unexpected error in access control:', err);
        }
    }

    function handleLocks(lockedPages) {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash || '#overview'; // Default to overview if empty

        // 1. Check Global Lock
        if (lockedPages['all']) {
            blockEntirePage(lockedPages['all']);
            return; // Stop processing
        }

        // 2. Check current standalone page
        // e.g. /user/rewards.html matches /rewards (or just check if filename contains it)
        for (const [key, reason] of Object.entries(lockedPages)) {
            if (key.startsWith('/') && currentPath.includes(key)) {
                blockEntirePage(reason);
                return;
            }
        }

        // 3. SPA Section Locks (for index.html)
        if (currentPath.includes('index.html') || currentPath.endsWith('/user/')) { // simplistic check for dashboard
            applyDashboardLocks(lockedPages);
        }
    }

    function blockEntirePage(reason) {
        // Use SweetAlert to block interaction
        Swal.fire({
            title: 'Access Restricted',
            html: `<div style="font-size:1.1rem; color:#ef4444; margin-bottom:10px;"><i class="fas fa-lock"></i> This page is currently locked by admin.</div>
                   <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; color:var(--text-secondary);">${reason}</div>`,
            icon: 'warning',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false, // User cannot dismiss
            background: '#0f172a',
            color: '#fff'
        });

        // Also hide body content to prevent reading behind modal if desired, or just trust Swal backdrop
        // document.body.style.display = 'none'; // distinct from swal
    }

    function applyDashboardLocks(lockedPages) {
        // Map identifiers to section IDs or nav links
        // Identifiers from admin: /dashboard, /tasks, /projects, /team, /leaderboard, /rewards, /profile

        const sectionMap = {
            '/dashboard': 'overview', // ID in index.html
            '/overview': 'overview',
            '/projects': 'projects',
            '/team': 'team',
            '/community': 'team', // Community chat is in team section?
            '/leaderboard': 'leaderboard',
            '/rewards': 'rewards',
            '/profile': 'profile',
            '/meetings': 'meetings' // virtual section
        };

        // 1. Visually Lock Nav Items
        document.querySelectorAll('.nav-item').forEach(nav => {
            const section = nav.getAttribute('data-section') || nav.getAttribute('href')?.replace('#', '');

            // Reverse lookup or check direct mapping
            // We iterate lockedPages keys
            for (const [lockKey, reason] of Object.entries(lockedPages)) {
                const targetSection = sectionMap[lockKey];

                // If the nav item matches a locked section
                if (targetSection === section) {
                    lockNavItem(nav, reason);
                }
            }
        });

        // 2. Monitor Navigation (Hash Change & Click)
        // We override the navigation handler or add an interceptor
        // Since we can't easily hook into 'navigateTo' global without race conditions, we'll monitor hash/state

        const enforceCurrentSection = () => {
            const currentSection = (window.location.hash || '#overview').replace('#', '');

            // Check if current section is locked
            for (const [lockKey, reason] of Object.entries(lockedPages)) {
                if (sectionMap[lockKey] === currentSection) {
                    // Redirect to safe page or show alert
                    Swal.fire({
                        icon: 'error',
                        title: 'Section Locked',
                        text: reason,
                        background: '#0f172a',
                        color: '#fff'
                    }).then(() => {
                        // Go back to overview if overview is not locked, else... nowhere?
                        if (!lockedPages['/dashboard'] && !lockedPages['/overview']) {
                            window.location.hash = '#overview';
                            // Manually trigger nav if needed, but hash change should do it
                            if (typeof navigateTo === 'function') navigateTo('overview');
                        }
                    });
                    return;
                }
            }
        };

        window.addEventListener('hashchange', enforceCurrentSection);

        // Initial check
        enforceCurrentSection();
    }

    function lockNavItem(navElement, reason) {
        navElement.classList.add('locked');
        navElement.setAttribute('title', `Locked: ${reason}`);

        // Remove existing click listeners by cloning (crude but effective)
        // OR add a capture listener that stops propagation
        navElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Swal.fire({
                icon: 'warning',
                title: 'Access Denied',
                text: reason,
                background: '#0f172a',
                color: '#fff'
            });
        }, true); // Capture phase to run before other listeners
    }

    // Run immediately
    checkAccess();

    // Poll for changes every 30 seconds (optional, but good for "Maintenance Mode")
    setInterval(checkAccess, 30000);

})();
