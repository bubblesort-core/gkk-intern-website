/**
 * GKK Interns UI Interaction Handler
 * Manages privacy notices and UI interactions
 * 
 * @version 2.0.0
 */
(function () {
    'use strict';

    // HTML Template for the Notice Bar
    const UI_TEMPLATE = `
    <div id="appNoticeBar" class="app-notice-bar">
        <div class="app-notice-content">
            <div class="app-notice-text">
                <div class="app-notice-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div>
                    <h4 class="app-notice-heading">We value your privacy</h4>
                    <p class="app-notice-desc">
                        We use local storage to enhance your experience and analyze traffic. 
                        You can control these settings at any time.
                    </p>
                </div>
            </div>
            <div class="app-notice-actions">
                <button id="btnCustomize" class="pro-btn pro-btn-ghost pro-btn-sm">Settings</button>
                <button id="btnReject" class="pro-btn pro-btn-secondary pro-btn-sm">Essential Only</button>
                <button id="btnAcceptAll" class="pro-btn pro-btn-primary pro-btn-sm">Accept All</button>
            </div>
        </div>
    </div>

    <div id="appSettingsModalOverlay" class="app-modal-overlay">
        <div class="app-modal">
            <div class="app-modal-header">
                <h3><i class="fas fa-sliders-h"></i> Privacy Preferences</h3>
                <button id="btnCloseModal" class="app-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="app-modal-body">
                <p class="text-muted mb-4">Manage how we store data in your browser.</p>
                
                <div class="app-setting-item">
                    <div class="app-setting-header">
                        <div class="app-setting-title">
                            <i class="fas fa-lock text-primary"></i> 
                            Essential Features
                        </div>
                        <div class="app-toggle">
                            <input type="checkbox" checked disabled>
                            <span class="app-slider"></span>
                        </div>
                    </div>
                    <p class="app-setting-desc">Required for the website to function (login, sessions, security).</p>
                </div>

                <div class="app-setting-item">
                    <div class="app-setting-header">
                        <div class="app-setting-title">
                            <i class="fas fa-magic text-info"></i> 
                            Personalization
                        </div>
                        <div class="app-toggle">
                            <input type="checkbox" id="toggleUserSettings" checked>
                            <span class="app-slider"></span>
                        </div>
                    </div>
                    <p class="app-setting-desc">Remembers your theme, layout, and language preferences.</p>
                </div>

                <div class="app-setting-item">
                    <div class="app-setting-header">
                        <div class="app-setting-title">
                            <i class="fas fa-chart-bar text-warning"></i> 
                            Experience Improvement
                        </div>
                        <div class="app-toggle">
                            <input type="checkbox" id="toggleMetrics" checked>
                            <span class="app-slider"></span>
                        </div>
                    </div>
                    <p class="app-setting-desc">Helps us understand how you use the site to improve features.</p>
                </div>
            </div>
            <div class="app-modal-footer">
                <button id="btnSaveSettings" class="pro-btn pro-btn-primary">Save Preferences</button>
            </div>
        </div>
    </div>
    `;

    // Initialize immediately if document ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function createUI() {
        if (!window.StateManager) {
            console.warn('StateManager not found');
            return;
        }

        // Check if already consented
        if (window.StateManager.hasAnyState()) {
            return;
        }

        // Create container
        const container = document.createElement('div');
        container.innerHTML = UI_TEMPLATE;
        document.body.appendChild(container);

        const banner = document.getElementById('appNoticeBar');

        // Add event listeners
        document.getElementById('btnAcceptAll').addEventListener('click', acceptAll);
        document.getElementById('btnReject').addEventListener('click', rejectNonEssential);
        document.getElementById('btnCustomize').addEventListener('click', showModal);

        // Modal listeners
        document.getElementById('btnCloseModal').addEventListener('click', hideModal);
        document.getElementById('appSettingsModalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'appSettingsModalOverlay') hideModal();
        });
        document.getElementById('btnSaveSettings').addEventListener('click', savePreferences);

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (banner) banner.classList.add('show');
            });
        });
    }

    function acceptAll() {
        window.StateManager.acceptAll();
        hideBanner();
    }

    function rejectNonEssential() {
        window.StateManager.acceptCore();
        hideBanner();
    }

    function savePreferences() {
        const features = window.StateManager.getFeatures();
        const preferences = {};

        // Essential always true
        preferences[features.ESSENTIAL] = true;

        // Read toggles
        const userSettingsToggle = document.getElementById('toggleUserSettings');
        const metricsToggle = document.getElementById('toggleMetrics');

        preferences[features.PREFERENCES] = userSettingsToggle ? userSettingsToggle.checked : false;
        preferences[features.ANALYTICS] = metricsToggle ? metricsToggle.checked : false;
        preferences[features.MARKETING] = false;

        window.StateManager.saveState(preferences);
        hideModal();
        hideBanner();
    }

    function hideBanner() {
        const banner = document.getElementById('appNoticeBar');
        if (banner) {
            banner.classList.remove('show');
            banner.classList.add('hide');
            setTimeout(() => {
                banner.remove(); // Remove banner
                // Also remove the modal container (it's the parent of the overlay in my template logic, 
                // but actually my template creates a div wrapped around both. 
                // Let's find the container properly)
                const overlay = document.getElementById('appSettingsModalOverlay');
                if (overlay && overlay.parentElement) {
                    // Check if parent is the container div we added
                    if (!overlay.parentElement.classList.contains('app-body')) {
                        // It's likely the div we added, but to be safe let's just remove overlay
                        overlay.remove();
                    }
                }
            }, 500);
        }
    }

    function showModal() {
        const overlay = document.getElementById('appSettingsModalOverlay');
        if (overlay) {
            overlay.classList.add('show');
            overlay.style.visibility = 'visible'; // Force visibility
        }
    }

    function hideModal() {
        const overlay = document.getElementById('appSettingsModalOverlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.style.visibility = 'hidden';
            }, 300);
        }
    }

    /**
     * Initialize UI
     */
    function init() {
        // Small delay to let page load
        setTimeout(() => {
            createUI();
        }, 800);
    }

    // Expose API
    window.InteractionHandler = {
        show: createUI,
        showPreferences: showModal,
        reset: () => {
            if (window.StateManager) window.StateManager.resetState();
        }
    };

})();
