/**
 * Admin SPA Router — Seamless page transitions with memory caching
 * 
 * How it works:
 * 1. Intercepts navigation clicks
 * 2. Caches pages (DOM + Styles) in memory on first visit
 * 3. On revisit, effortlessly switches DOM nodes to preserve 100% of user state (filters, scroll, inputs)
 * 4. Silently auto-clicks the page's "Refresh" button behind the scenes to fetch new data without wiping state.
 */

(function () {
    'use strict';

    // --- State ---
    let currentActivePage = getCurrentPageFromURL();
    let isNavigating = false;
    
    // Memory Cache for Pages
    // Shape: { [pageName]: { mainNode: Element, styleNodes: [Element], extraNodes: [Element] } }
    const pageCache = {};

    // Scripts that are shared/global and should NOT be re-executed
    const GLOBAL_SCRIPTS = [
        'supabase-client.js',
        'admin-sidebar.js',
        'admin-router.js',
        'admin-identity.js',
        'main-page-btn.js',
        'skeleton-ui.js',
        'supabase',        
        'font-awesome',    
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
        return (url || '').split('?')[0].split('/').pop() || 'index.html';
    }

    function isGlobalScript(src) {
        if (!src) return false;
        return GLOBAL_SCRIPTS.some(g => src.includes(g));
    }

    function isAdminPage(href) {
        if (!href) return false;
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) return false;
        if (href.startsWith('../') || href.startsWith('/')) return false; 
        const pageName = href.split('?')[0]; 
        if (!pageName.endsWith('.html')) return false;
        return true;
    }

    function wrapScriptForSPA(scriptContent, pageName) {
        const exportedFunctions = [];
        // Match both sync and async function declarations
        const functionRegex = /(?:async\s+)?function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(/g;
        let match;
        
        while ((match = functionRegex.exec(scriptContent)) !== null) {
            const funcName = match[1];
            if (funcName && !exportedFunctions.includes(funcName)) {
                exportedFunctions.push(funcName);
            }
        }
        
        // Also match variable-assigned functions: const/let/var foo = function/async/( 
        const varFuncRegex = /(?:const|let|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*(?:async\s+)?(?:function|\()/g;
        while ((match = varFuncRegex.exec(scriptContent)) !== null) {
            const funcName = match[1];
            if (funcName && !exportedFunctions.includes(funcName)) {
                exportedFunctions.push(funcName);
            }
        }
        
        let exportsStr = exportedFunctions.map(fn => `
            if (typeof ${fn} !== 'undefined') {
                window.${fn} = ${fn};
                currentExports['${fn}'] = ${fn};
            }
        `).join('\n');
        
        return `
            (function() {
                try {
                    const currentExports = {};
                    ${scriptContent}
                    ${exportsStr}
                    window.__spaPageExports = window.__spaPageExports || {};
                    window.__spaPageExports['${pageName}'] = currentExports;
                } catch (e) {
                    console.error('Error executing SPA script for page ${pageName}:', e);
                }
            })();
        `;
    }

    // --- DOM Cache Management ---

    function recordCurrentPageIntoCache(pageName) {
        if (pageCache[pageName]) return; // Already tracking
        
        const mainContent = document.querySelector('main.main-content') || document.querySelector('.main-content');
        if (!mainContent) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'spa-page-wrapper active';
        wrapper.setAttribute('data-page', pageName);
        
        // Encapsulate existing content into the wrapper
        while (mainContent.firstChild) {
            wrapper.appendChild(mainContent.firstChild);
        }
        mainContent.appendChild(wrapper);

        // Capture styles & modals not yet flagged as SPA injected
        const styleNodes = Array.from(document.querySelectorAll('head style'))
            .filter(s => !s.textContent.includes('loader-ring') && !s.getAttribute('data-spa-page'));
            
        const extraNodes = Array.from(document.querySelectorAll('body > .modal-overlay, body > div[id$="Modal"]'))
            .filter(s => !s.getAttribute('data-spa-injected'));

        styleNodes.forEach(s => s.setAttribute('data-spa-page', pageName));
        extraNodes.forEach(e => e.setAttribute('data-spa-injected', pageName));

        pageCache[pageName] = { mainNode: wrapper, styleNodes, extraNodes };
    }

    function detachCurrentPage() {
        if (!currentActivePage) return;
        const cache = pageCache[currentActivePage];
        if (!cache) return;
        
        if (cache.mainNode && cache.mainNode.parentNode) {
            cache.mainNode.parentNode.removeChild(cache.mainNode);
        }
        cache.styleNodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
        cache.extraNodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
    }

    function attachCachedPage(pageName) {
        const cache = pageCache[pageName];
        if (!cache) return;

        const mainContent = document.querySelector('main.main-content') || document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = ''; // Keep it clean
            mainContent.appendChild(cache.mainNode);
        }
        
        cache.styleNodes.forEach(n => document.head.appendChild(n));
        cache.extraNodes.forEach(n => document.body.appendChild(n));

        // Restore window exports for this page to handle global onclick attributes
        if (window.__spaPageExports && window.__spaPageExports[pageName]) {
            const exports = window.__spaPageExports[pageName];
            for (const key in exports) {
                window[key] = exports[key];
            }
        }

        triggerSilentBackgroundRefresh(pageName);
    }

    function triggerSilentBackgroundRefresh(pageName) {
        if (!window.__spaPageExports) return;
        const exports = window.__spaPageExports[pageName];
        if (!exports) return;

        // Try to find a data loading function
        const possibleFunctions = Object.keys(exports).filter(k => k.startsWith('load') || k === 'init');
        const loadFnName = possibleFunctions.find(k => k !== 'init') || 'init';
        
        if (exports[loadFnName] && typeof exports[loadFnName] === 'function') {
            const cache = pageCache[pageName];
            if (cache && cache.mainNode) {
                const refreshIcon = cache.mainNode.querySelector('.fa-sync-alt');
                if (refreshIcon) {
                    refreshIcon.style.transition = 'transform 1s ease';
                    refreshIcon.style.transform = 'rotate(360deg)';
                    setTimeout(() => {
                        refreshIcon.style.transition = 'none';
                        refreshIcon.style.transform = 'rotate(0deg)';
                    }, 1000);
                }
            }
            // Execute it asynchronously so UI doesn't block
            setTimeout(() => {
                try { exports[loadFnName](); } catch(e){}
            }, 50);
        }
    }

    // --- Core Navigation ---
    async function navigateTo(page, pushState = true, forceWipe = false) {
        if (isNavigating) return;
        
        const targetFilename = page.split('?')[0];
        if (targetFilename === currentActivePage && !page.includes('?') && !forceWipe) return;

        isNavigating = true;
        showLoading();

        try {
            // CACHE HIT
            if (!forceWipe && pageCache[targetFilename]) {
                if (currentActivePage) {
                    recordCurrentPageIntoCache(currentActivePage);
                    detachCurrentPage();
                }

                currentActivePage = targetFilename;
                attachCachedPage(targetFilename);

                if (pushState) history.pushState({ page: page }, '', page);
                updateSidebarActive(page);
                
                const mainContent = document.querySelector('.main-content');
                if (mainContent) mainContent.scrollTop = 0;
                window.scrollTo(0, 0);

                hideLoading();
                isNavigating = false;
                return;
            }

            // CACHE MISS OR COMPELETE WIPE
            if (forceWipe && pageCache[targetFilename]) {
                delete pageCache[targetFilename]; // clear memory if forced
            }

            const response = await fetch(targetFilename);
            if (!response.ok) throw new Error(`Failed to load ${targetFilename}: ${response.status}`);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newStyles = Array.from(doc.querySelectorAll('head style'))
                .filter(s => !s.textContent.includes('loader-ring'));

            const newMain = doc.querySelector('main.main-content') || doc.querySelector('.main-content');
            if (!newMain) {
                window.location.href = page;
                return;
            }

            const newScripts = Array.from(doc.querySelectorAll('script'))
                .filter(s => !s.src && !s.textContent.includes('admin-loading-overlay'));

            const newExtras = Array.from(doc.querySelectorAll('body > .modal-overlay, body > div[id$="Modal"]'));

            // 1. Snapshot and Detach Active Page
            if (currentActivePage) {
                recordCurrentPageIntoCache(currentActivePage);
                detachCurrentPage();
            }

            // 2. Prepare the new Page DOM components
            const wrapper = document.createElement('div');
            wrapper.className = 'spa-page-wrapper active';
            wrapper.setAttribute('data-page', targetFilename);
            wrapper.innerHTML = newMain.innerHTML;

            const styleElements = [];
            newStyles.forEach(s => {
                const style = document.createElement('style');
                style.setAttribute('data-spa-page', targetFilename);
                style.textContent = s.textContent;
                styleElements.push(style);
            });

            const extraElements = [];
            newExtras.forEach(e => {
                const elWrap = document.createElement('div');
                elWrap.innerHTML = e.outerHTML;
                const el = elWrap.firstElementChild;
                if (el) {
                    el.setAttribute('data-spa-injected', targetFilename);
                    extraElements.push(el);
                }
            });

            // 3. Save into cache tracker immediately
            pageCache[targetFilename] = {
                mainNode: wrapper,
                styleNodes: styleElements,
                extraNodes: extraElements
            };
            currentActivePage = targetFilename;

            // 4. Inject into document
            attachCachedPage(targetFilename);

            // 5. Update metadata
            const newTitle = doc.querySelector('title');
            if (newTitle) document.title = newTitle.textContent;
            
            if (pushState) history.pushState({ page: page }, '', page);
            updateSidebarActive(page);
            
            // 6. Execute Scripts once (they stay in IIFE memory permanently)
            const origAddEventListener = document.addEventListener.bind(document);
            document.addEventListener = function(type, fn, opts) {
                if (type === 'DOMContentLoaded') {
                    setTimeout(fn, 0);
                    return;
                }
                origAddEventListener(type, fn, opts);
            };

            newScripts.forEach(s => {
                const scriptText = s.textContent;
                const wrappedScript = wrapScriptForSPA(scriptText, targetFilename);
                const script = document.createElement('script');
                script.setAttribute('data-spa-page', targetFilename);
                script.textContent = wrappedScript;
                document.body.appendChild(script);
            });

            document.addEventListener = origAddEventListener;

            const mainContentEl = document.querySelector('.main-content');
            if (mainContentEl) mainContentEl.scrollTop = 0;
            window.scrollTo(0, 0);

            hideLoading();

        } catch (err) {
            console.error('SPA Router Error:', err);
            hideLoading();
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
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.addEventListener('click', (e) => {
                const link = e.target.closest('a.nav-link');
                if (!link) return;

                const href = link.getAttribute('href');
                if (!isAdminPage(href)) return;

                e.preventDefault();

                const sidebarEl = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                if (sidebarEl && sidebarEl.classList.contains('open')) {
                    sidebarEl.classList.remove('open');
                    if (overlay) overlay.style.display = 'none';
                }

                navigateTo(href);
            });
        }

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            if (link.closest('.sidebar')) return;

            const href = link.getAttribute('href');
            if (!isAdminPage(href)) return;

            e.preventDefault();
            navigateTo(href);
        });
    }

    // --- Overrides ---
    window.addEventListener('popstate', (e) => {
        const page = e.state?.page || getCurrentPageFromURL();
        if (page && page !== currentActivePage) {
            navigateTo(page, false);
        }
    });

    window.refreshCurrentPage = function () {
        // Find the active page and hit its refresh button naturally, if possible
        const activeCache = pageCache[currentActivePage];
        if (activeCache && activeCache.mainNode) {
            const refreshIcon = activeCache.mainNode.querySelector('.fa-sync-alt');
            if (refreshIcon) {
                const btn = refreshIcon.closest('button, a');
                if (btn) {
                    btn.click();
                    return;
                }
            }
        }
        // Fallback: If no dedicated refresh button logic is registered, wipe cache and reload
        navigateTo(currentActivePage, false, true);
    };

    window.spaNavigate = function (page) {
        if (isAdminPage(page)) navigateTo(page);
        else window.location.href = page;
    };

    // --- Boot Sequence ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                setupInterception();
                recordCurrentPageIntoCache(currentActivePage);
            }, 50);
        });
    } else {
        setTimeout(() => {
            setupInterception();
            recordCurrentPageIntoCache(currentActivePage);
        }, 50);
    }

})();
