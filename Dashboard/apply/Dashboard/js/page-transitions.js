/**
 * Enhanced Page Transitions System
 * Uses GSAP for professional animations
 * Supports back/forward navigation and specific themes per page type
 */

(function () {
    'use strict';

    // Page themes configuration
    const PAGE_THEMES = {
        // --- AUTH & LANDING ---
        'index': {
            theme: 'theme-home',
            icon: 'fas fa-rocket',
            animation: 'launch',
            text: 'Launching Ecosystem...',
            subtext: 'Preparing your experience'
        },
        'admin-auth': {
            theme: 'theme-admin',
            icon: 'fas fa-lock',
            animation: 'pulse',
            text: 'Securing Admin Portal...',
            subtext: 'Verifying credentials'
        },
        'user-auth': {
            theme: 'theme-user',
            icon: 'fas fa-lock',
            animation: 'pulse',
            text: 'Secure Login...',
            subtext: 'Authenticating'
        },
        'signup': {
            theme: 'theme-signup',
            icon: 'fas fa-lock',
            animation: 'pulse',
            text: 'Creating Secure Account...',
            subtext: 'Join the ecosystem'
        },

        // --- DASHBOARDS ---
        'admin-dashboard': {
            theme: 'theme-admin-dash',
            icon: 'fas fa-chart-network',
            animation: 'pulse',
            text: 'Loading Headquarters...',
            subtext: 'Fetching usage analytics'
        },
        'user-dashboard': {
            theme: 'theme-user-dash',
            icon: 'fas fa-lock',
            animation: 'unlock',
            text: 'Unlocking Dashboard...',
            subtext: 'Access granted'
        },

        // --- FEATURES ---
        'apply': {
            theme: 'theme-apply',
            icon: 'fas fa-paper-plane',
            animation: 'write',
            text: 'Sending Application...',
            subtext: 'Preparing form data'
        },
        'community': {
            theme: 'theme-community',
            icon: 'fas fa-users',
            animation: 'bounce',
            text: 'Joining Community...',
            subtext: 'Connecting to peers'
        },
        'payment': {
            theme: 'theme-payment',
            icon: 'fas fa-credit-card',
            animation: 'flip',
            text: 'Processing Securely...',
            subtext: 'Please do not close'
        },

        // --- DEFAULTS ---
        'default': {
            theme: 'theme-default',
            icon: 'fas fa-circle-notch',
            animation: 'spin',
            text: 'Loading...',
            subtext: 'Just a moment'
        }
    };

    const TRANSITION_TARGETS = new Set([
        'apply',
        'admin-auth',
        'user-auth',
        'signup',
        'user-dashboard'
    ]);

    let overlay, icon, title, subtitle;

    function getPageType(url) {
        if (!url) return 'default';
        const path = url.toLowerCase();

        // 1. Apply Form
        if (path.includes('/apply') || path.includes('bento-form')) return 'apply';

        // 2. Admin
        if (path.includes('/admin/login')) return 'admin-auth';
        if (path.includes('/admin')) return 'admin-dashboard';

        // 3. User Auth
        if (path.includes('/user/login')) return 'user-auth';
        if (path.includes('/user/signup') || path.includes('register')) return 'signup';

        // 4. User Dashboard
        // Only the main dashboard entry should trigger the unlock animation
        if (
            path.includes('/dashboard/index.html') ||
            /\/dashboard\/?$/.test(path)
        ) {
            return 'user-dashboard';
        }

        // 5. Landing / Root
        if (path === '/' || path.includes('index.html')) return 'index';

        return 'default';
    }

    function createOverlay() {
        if (document.getElementById('gkk-page-transition')) return;

        overlay = document.createElement('div');
        overlay.id = 'gkk-page-transition';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            opacity: 1; /* Start visible for initial load */
        `;

        // Background
        const bg = document.createElement('div');
        bg.className = 'transition-bg';
        bg.style.cssText = `
            position: absolute;
            inset: 0;
            background: #0f172a;
            width: 100%;
            height: 100%;
        `;
        overlay.appendChild(bg);

        // Content Container
        const content = document.createElement('div');
        content.style.cssText = `
            position: relative;
            z-index: 10;
            text-align: center;
            color: white;
            font-family: 'Inter', sans-serif;
        `;

        // Icon
        icon = document.createElement('i');
        icon.className = 'fas fa-circle-notch';
        icon.style.cssText = `
            font-size: 3rem;
            margin-bottom: 1.5rem;
            display: block;
        `;
        content.appendChild(icon);

        // Text
        title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        `;
        content.appendChild(title);

        subtitle = document.createElement('div');
        subtitle.style.cssText = `
            font-size: 0.875rem;
            color: #94a3b8;
        `;
        content.appendChild(subtitle);

        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    function updateTheme(pageType) {
        const config = PAGE_THEMES[pageType] || PAGE_THEMES.default;

        if (icon) {
            icon.className = config.icon;
            // Reset
            gsap.killTweensOf(icon);
            gsap.set(icon, { clearProps: "all" });

            // 1. Launch (Home / Index) - Rocket taking off
            if (config.animation === 'launch') {
                const tl = gsap.timeline({ repeat: -1 });
                tl.to(icon, { y: -5, duration: 1, ease: "sine.inOut", yoyo: true, repeat: 1 }) // Float prep
                    .to(icon, { y: -50, opacity: 0, scale: 1.5, duration: 0.4, ease: "power4.in" }) // Blast off
                    .set(icon, { y: 50, opacity: 0, scale: 0.5 }) // Reset
                    .to(icon, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" }); // Land
            }
            // 2. Lock-In (Auth) - Heavy secure slam
            else if (config.animation === 'pulse') {
                // Replacing generic 'pulse' with a secure 'Lock-In' for auth
                gsap.fromTo(icon,
                    { scale: 2, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.3)" }
                );
            }
            // 3. Fly (Apply) - Paper plane gliding
                else if (config.animation === 'write') {
                    gsap.set(icon, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 });
                    gsap.fromTo(
                        icon,
                        { x: 0, y: 0, scale: 1, opacity: 1 },
                        {
                            x: 300,
                            y: -300,
                            scale: 0.5,
                            opacity: 0,
                            duration: 0.8,
                            delay: 0.2,
                            ease: "power2.inOut"
                        }
                    );
            }
            // 4. Unlock (Dashboard) - Shake and open
            else if (config.animation === 'unlock' || config.animation === 'bounce') {
                // Unified Dashboard unlock animation
                const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
                tl.to(icon, { rotation: -10, duration: 0.1, yoyo: true, repeat: 2 }) // Shake
                    .to(icon, {
                        scale: 1.1, duration: 0.2, onStart: () => {
                            icon.classList.remove('fa-lock');
                            icon.classList.add('fa-lock-open');
                        }
                    }) // Pop Open
                    .to(icon, {
                        scale: 1,
                        duration: 0.2,
                        delay: 1,
                        onComplete: () => {
                            // Reset for loop if it repeats
                            icon.classList.remove('fa-lock-open');
                            icon.classList.add('fa-lock');
                        }
                    });
            }
            // 5. Default Spin (Loading)
            else if (config.animation === 'spin') {
                gsap.to(icon, { rotation: 360, duration: 1, repeat: -1, ease: "linear" });
            }
            // Default - Gentle Float for anything else
            else {
                gsap.from(icon, { scale: 0, duration: 0.5, ease: "back.out(1.7)" });
                gsap.to(icon, { y: -5, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.5 });
            }
        }

        if (title) title.textContent = config.text;
        if (subtitle) subtitle.textContent = config.subtext;
    }

    function showTransition(targetUrl, callback) {
        // 1. Setup Theme based on TARGET
        const pageType = getPageType(targetUrl);
        updateTheme(pageType);

        // 2. Animate In
        if (!overlay) createOverlay();

            const exitDelay = pageType === 'apply' ? 1000 : 0;

            gsap.to(overlay, {
                opacity: 1,
                pointerEvents: 'all',
                duration: 0.3,
                onComplete: () => {
                    if (exitDelay > 0) {
                        setTimeout(() => {
                            if (callback) callback();
                            else if (targetUrl) window.location.href = targetUrl;
                        }, exitDelay);
                    } else {
                        if (callback) callback();
                        else if (targetUrl) window.location.href = targetUrl;
                    }
                }
            });
    }

    function hideTransition() {
        if (!overlay) return;

        gsap.to(overlay, {
            opacity: 0,
            pointerEvents: 'none',
            duration: 0.5,
            delay: 0.2
        });
    }

    function setup() {
        // Delay setup slightly to ensure DOM is ready if called early
        if (!document.body) {
            window.addEventListener('DOMContentLoaded', setup);
            return;
        }

        // Check if this is a Page Reload
        const navEntry = performance.getEntriesByType("navigation")[0];
        const isReload = navEntry && navEntry.type === 'reload';

        // Only show Entry Animation if it's NOT a reload and we're on the intro page
        if (!isReload) {
            const currentPageType = getPageType(window.location.pathname);
            if (currentPageType === 'index') {
                createOverlay();
                updateTheme(currentPageType);
                setTimeout(hideTransition, 500);
            }
        }

        // Link Interception
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (
                !href ||
                href.startsWith('#') ||
                href.startsWith('javascript:') ||
                link.target === '_blank' ||
                link.hasAttribute('download') ||
                link.dataset.noTransition === 'true'
            ) {
                return;
            }

            let targetUrl;
            try {
                targetUrl = new URL(href, window.location.href);
            } catch {
                return;
            }

            if (targetUrl.origin !== window.location.origin) return;

            const pageType = getPageType(targetUrl.pathname);
            if (!TRANSITION_TARGETS.has(pageType)) return;

            e.preventDefault();
            showTransition(targetUrl.href, () => {
                window.location.href = targetUrl.href;
            });
        });

        // Browser Back/Forward
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) hideTransition();
        });
    }

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    // Expose API
    window.PageTransition = {
        show: showTransition,
        hide: hideTransition,
        updateTheme: updateTheme
    };

    init();

})();
