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

            let currentBatchId = null;
            try {
                const { data: membership } = await supabaseClient
                    .from('team_members')
                    .select('teams(batch_id)')
                    .eq('user_id', user.id)
                    .maybeSingle();

                currentBatchId = membership?.teams?.batch_id || null;
            } catch (batchErr) {
                console.warn('Could not resolve current batch for access control:', batchErr);
            }

            // Fetch active locks for this user or global
            const { data: locks, error } = await supabaseClient
                .from('access_controls')
                .select('page_identifier, reason, target_type, target_user_id, target_intern_id, target_batch_id')
                .eq('is_locked', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Access control check failed:', error);
                return;
            }

            if (!locks || locks.length === 0) return;

            const applicableLocks = locks.filter(lock => {
                const lockType = lock.target_type || (lock.target_batch_id ? 'batch' : (lock.target_user_id || lock.target_intern_id ? 'intern' : 'all'));

                if (lockType === 'all') return true;

                if (lockType === 'intern') {
                    return (lock.target_intern_id || lock.target_user_id) === user.id;
                }

                if (lockType === 'batch') {
                    return !!currentBatchId && lock.target_batch_id === currentBatchId;
                }

                return false;
            });

            // map of locked pages
            const lockedPages = applicableLocks.reduce((acc, lock) => {
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
        // Identifiers from admin: /overview, /payment, /projects, /team, /announcements, /meetings, /recordings, /resources, /rewards, /profile

        const sectionMap = {
            '/dashboard': 'overview', // legacy identifier
            '/overview': 'overview',
            '/payment': 'payment',
            '/projects': 'projects',
            '/team': 'team',
            '/announcements': 'announcements',
            '/meetings': 'meetings',
            '/recordings': 'recordings',
            '/resources': 'resources',
            '/rewards': 'rewards',
            '/profile': 'profile',
            '/tasks': 'projects',
            '/submissions': 'resources',
            '/community': 'team',
            '/leaderboard': 'rewards',
            'payment': 'payment',
            'overview': 'overview',
            'projects': 'projects',
            'team': 'team',
            'announcements': 'announcements',
            'meetings': 'meetings',
            'recordings': 'recordings',
            'resources': 'resources',
            'rewards': 'rewards',
            'profile': 'profile'
        };

        const normalizeSection = (value) => {
            const raw = (value || '').trim().toLowerCase();
            const labelMap = {
                'training fee': 'payment',
                'complete registration': 'payment',
                'complete payment': 'payment',
                'dashboard overview': 'overview',
                'overview': 'overview',
                'profile': 'profile',
                'projects': 'projects',
                'team': 'team',
                'updates': 'announcements',
                'announcements': 'announcements',
                'live meetings': 'meetings',
                'recorded sessions': 'recordings',
                'resources': 'resources',
                'rewards & coupons': 'rewards',
                'rewards': 'rewards'
            };

            return labelMap[raw] || raw;
        };

        // 1. Visually Lock Nav Items
        document.querySelectorAll('.nav-item, .dash-nav-item, .dash-mobile-nav-item').forEach(nav => {
            const section = normalizeSection(nav.getAttribute('data-section') || nav.getAttribute('data-label') || nav.getAttribute('aria-label') || nav.getAttribute('title') || nav.getAttribute('href')?.replace('#', '') || nav.textContent);

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
