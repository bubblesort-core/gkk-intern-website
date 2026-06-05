/**
 * Admin SPA Router — Seamless page transitions without full page reloads
 * 
 * How it works:
 * 1. Intercepts all sidebar navigation clicks
 * 2. Fetches target page HTML via fetch()
 * 3. Extracts inline <style>, <main> content, and inline <script> blocks
 * 4. Injects extracted content into the current page
 * 5. Executes extracted scripts dynamically
 * 6. Updates URL via pushState + handles popstate for back/forward
 */

(function () {
    'use strict';

    // --- State ---
    let currentPage = getCurrentPageFromURL();
    let isNavigating = false;
    let currentPageStyles = [];   // Track injected <style> elements for cleanup
    let currentPageScripts = [];  // Track injected <script> elements for cleanup

    // Scripts that are shared/global and should NOT be re-executed on navigation
    const GLOBAL_SCRIPTS = [
        'supabase-client.js',
        'admin-sidebar.js',
        'admin-router.js',
        'admin-identity.js',
        'main-page-btn.js',
        'skeleton-ui.js',
        'supabase',        // CDN
        'font-awesome',    // CDN
    ];

    // --- Loading Bar ---
    const loadingBar = document.createElement('div');
    loadingBar.id = 'spa-loading-bar';
    loadingBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        width: 0%;
        background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
        z-index: 99999;
        transition: width 0.3s ease;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        pointer-events: none;
    `;
    document.body.appendChild(loadingBar);

    function showLoading() {
        loadingBar.style.width = '0%';
        loadingBar.style.opacity = '1';
        // Animate progress
        requestAnimationFrame(() => {
            loadingBar.style.width = '30%';
            setTimeout(() => { loadingBar.style.width = '60%'; }, 150);
            setTimeout(() => { loadingBar.style.width = '80%'; }, 400);
        });
    }

    function hideLoading() {
        loadingBar.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.opacity = '0';
            setTimeout(() => { loadingBar.style.width = '0%'; }, 300);
        }, 200);
    }

    // --- Utilities ---
    function getCurrentPageFromURL() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        const search = window.location.search;
        return page + search;
    }

    function getPageName(url) {
        // Extract just the filename (without query params)
        return (url || '').split('?')[0].split('/').pop() || 'index.html';
    }

    function isGlobalScript(src) {
        if (!src) return false;
        return GLOBAL_SCRIPTS.some(g => src.includes(g));
    }

    function isAdminPage(href) {
        if (!href) return false;
        // Must be a relative link to an admin .html page
        // Not an external URL, not a hash link, not javascript:
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) return false;
        if (href.startsWith('../') || href.startsWith('/')) return false; // Links outside admin
        const pageName = href.split('?')[0]; // Strip query params for check
        if (!pageName.endsWith('.html')) return false;
        return true;
    }

    function wrapScriptForSPA(scriptContent) {
        // Extract all top-level function names so we can attach them to window
        // This is necessary because the script will be wrapped in an IIFE,
        // so its functions won't be in the global scope for HTML onclick="" handlers.
        const exportedFunctions = [];
        const functionRegex = /function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(/g;
        let match;
        
        while ((match = functionRegex.exec(scriptContent)) !== null) {
            const funcName = match[1];
            // Skip common keywords or anonymous functions (though regex handles most)
            if (funcName && !exportedFunctions.includes(funcName)) {
                exportedFunctions.push(funcName);
            }
        }
        
        let exportsStr = exportedFunctions.map(fn => `window.${fn} = ${fn};`).join('\n');
        
        // Wrap in IIFE
        return `
            (function() {
                try {
                    ${scriptContent}
                    
                    // SPA Exports
                    ${exportsStr}
                } catch (e) {
                    console.error('Error executing SPA script:', e);
                }
            })();
        `;
    }

    // --- Core Navigation ---
    async function navigateTo(page, pushState = true) {
        if (isNavigating) return;
        // Allow same-page navigation if query params differ (e.g., ?search=)
        if (page === currentPage && !page.includes('?')) return;

        isNavigating = true;
        showLoading();

        try {
            // Fetch the target page (strip query params for file fetch)
            const fetchUrl = page.split('?')[0];
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Failed to load ${fetchUrl}: ${response.status}`);
            const html = await response.text();

            // Parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract page-specific <style> tags from <head> (skip linked stylesheets)
            const newStyles = [];
            doc.querySelectorAll('head style').forEach(style => {
                // Skip the loading overlay style
                if (style.textContent.includes('loader-ring') || style.textContent.includes('l-spin')) return;
                newStyles.push(style.textContent);
            });

            // Extract <main class="main-content"> inner HTML
            const newMain = doc.querySelector('main.main-content') || doc.querySelector('.main-content');
            if (!newMain) {
                console.error('SPA Router: Could not find <main> in', page);
                // Fallback to full page navigation
                window.location.href = page;
                return;
            }

            // Extract inline <script> blocks (skip external/global scripts)
            const newScripts = [];
            doc.querySelectorAll('script').forEach(script => {
                if (script.src && isGlobalScript(script.src)) return;
                if (script.src) return; // Skip all external scripts (globals already loaded)
                // Skip loading overlay script
                if (script.textContent.includes('admin-loading-overlay')) return;
                newScripts.push(script.textContent);
            });

            // Extract modals/overlays that are outside <main> but inside <body>
            const extraElements = [];
            doc.querySelectorAll('body > .modal-overlay, body > div[id$="Modal"]').forEach(el => {
                extraElements.push(el.outerHTML);
            });

            // --- Apply Changes ---

            // 1. Clean up previous page's injected styles
            currentPageStyles.forEach(el => el.remove());
            currentPageStyles = [];

            // 2. Clean up previous page's injected scripts
            currentPageScripts.forEach(el => el.remove());
            currentPageScripts = [];

            // 3. Clean up previous page's extra elements (modals outside main)
            document.querySelectorAll('[data-spa-injected]').forEach(el => el.remove());

            // 4. Clear any global variables/functions from previous page
            // We do this by removing old event listeners (best effort via cloning)
            // Actually, script re-execution will overwrite globals naturally

            // 5. Inject new styles
            newStyles.forEach(cssText => {
                const style = document.createElement('style');
                style.setAttribute('data-spa-page', page);
                style.textContent = cssText;
                document.head.appendChild(style);
                currentPageStyles.push(style);
            });

            // 6. Inject main content
            const mainEl = document.querySelector('main.main-content') || document.querySelector('.main-content');
            if (mainEl) {
                mainEl.innerHTML = newMain.innerHTML;
            }

            // 7. Inject extra elements (modals)
            extraElements.forEach(html => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = html;
                const el = wrapper.firstElementChild;
                if (el) {
                    el.setAttribute('data-spa-injected', 'true');
                    document.body.appendChild(el);
                }
            });

            // 8. Update page title
            const newTitle = doc.querySelector('title');
            if (newTitle) document.title = newTitle.textContent;

            // 9. Update URL
            if (pushState) {
                history.pushState({ page: page }, '', page);
            }

            // 10. Update sidebar active state
            updateSidebarActive(page);

            // 11. Update current page tracker
            currentPage = page;

            // 12. Scroll to top
            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.scrollTop = 0;
            window.scrollTo(0, 0);

            // 13. Execute new scripts (must be after DOM injection)
            // Override addEventListener so DOMContentLoaded callbacks run immediately
            // (since DOM is already loaded in SPA mode)
            const origAddEventListener = document.addEventListener.bind(document);
            document.addEventListener = function(type, fn, opts) {
                if (type === 'DOMContentLoaded') {
                    // Execute immediately since DOM is already loaded
                    setTimeout(fn, 0);
                    return;
                }
                origAddEventListener(type, fn, opts);
            };

            newScripts.forEach(scriptText => {
                // Wrap in IIFE to prevent const/let redeclaration errors
                // when navigating between pages (global lexical scope persists)
                const wrappedScript = wrapScriptForSPA(scriptText);
                const script = document.createElement('script');
                script.setAttribute('data-spa-page', page);
                script.textContent = wrappedScript;
                document.body.appendChild(script);
                currentPageScripts.push(script);
            });

            // Restore original addEventListener
            document.addEventListener = origAddEventListener;

            hideLoading();

        } catch (err) {
            console.error('SPA Router Error:', err);
            hideLoading();
            // Fallback to traditional navigation
            window.location.href = page;
        } finally {
            isNavigating = false;
        }
    }

    function updateSidebarActive(page) {
        const pageName = getPageName(page);
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === pageName);
        });
    }

    // --- Event Delegation for sidebar links ---
    function setupInterception() {
        // Use event delegation on the sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.addEventListener('click', (e) => {
                const link = e.target.closest('a.nav-link');
                if (!link) return;

                const href = link.getAttribute('href');
                if (!isAdminPage(href)) return; // Let non-admin links navigate normally

                e.preventDefault();

                // Close mobile sidebar if open
                const sidebarEl = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                if (sidebarEl && sidebarEl.classList.contains('open')) {
                    sidebarEl.classList.remove('open');
                    if (overlay) overlay.style.display = 'none';
                }

                navigateTo(href);
            });
        }

        // Also intercept cross-page navigation links inside main content
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            // Check if it's inside sidebar (already handled)
            if (link.closest('.sidebar')) return;

            const href = link.getAttribute('href');
            if (!isAdminPage(href)) return;

            e.preventDefault();
            navigateTo(href);
        });
    }

    // --- Handle browser back/forward ---
    window.addEventListener('popstate', (e) => {
        const page = e.state?.page || getCurrentPageFromURL();
        if (page && page !== currentPage) {
            navigateTo(page, false); // Don't push state again
        }
    });

    // --- Global refresh function ---
    // Each page can define a `pageRefresh` function, or we re-navigate to current page
    window.refreshCurrentPage = function () {
        // Re-fetch and re-render the current page without changing URL
        const page = currentPage;
        isNavigating = false; // Reset in case
        currentPage = ''; // Force re-navigation
        navigateTo(page, false);
    };

    // --- Global SPA navigation function for inline onclick handlers ---
    window.spaNavigate = function (page) {
        if (isAdminPage(page)) {
            navigateTo(page);
        } else {
            window.location.href = page;
        }
    };

    // --- Override window.location.href for admin page links ---
    // Intercept programmatic navigation from inline onclick handlers
    // that still use window.location.href = 'page.html?params'
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    // Rather than overriding location (which is complex), we provide spaNavigate
    // and also intercept common patterns via MutationObserver for dynamically created buttons

    // --- Initialize ---
    // Set initial history state
    history.replaceState({ page: currentPage }, '', currentPage);

    // Setup after DOM is ready (sidebar is built by admin-sidebar.js on DOMContentLoaded)
    // We use a slight delay to ensure sidebar is built first
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(setupInterception, 50);
        });
    } else {
        setTimeout(setupInterception, 50);
    }

    console.log('[SPA Router] Initialized. Current page:', currentPage);
})();
