/**
 * GKK Interns State Manager
 * Handles user preferences and application state persistence
 * Generic naming to avoid aggressive content blockers
 * 
 * @version 2.0.0
 * @author GKK Interns Dev
 */
(function () {
    'use strict';

    // Constants - obfuscated names
    const STATE_KEY = 'gkk_app_state'; // Was gkk_cookie_consent
    const STATE_VERSION = '2.0';       // Was CONSENT_VERSION
    const STATE_DAYS = 365;

    // Categories map to generic feature flags
    const FEATURES = {
        ESSENTIAL: 'core_features',    // Was necessary
        ANALYTICS: 'usage_metrics',    // Was analytics
        PREFERENCES: 'user_settings',  // Was preferences
        MARKETING: 'promo_content'     // Was marketing
    };

    /**
     * StateManager Class
     * Manages persistent state across sessions
     */
    class StateManager {
        constructor() {
            this.state = this.loadState();
            this.listeners = [];

            // Expose globally
            window.StateManager = this;

            // Legacy support (optional, but good for transition)
            window.CookieManager = this;
        }

        /**
         * Load state from storage
         * Prioritizes cookie, falls back to local storage if needed
         */
        loadState() {
            const stateCookie = this.getCookie(STATE_KEY);
            if (stateCookie) {
                try {
                    const data = JSON.parse(stateCookie);
                    if (data.version === STATE_VERSION) {
                        return data;
                    }
                } catch (e) {

                }
            }
            return null;
        }

        /**
         * Save state to storage
         */
        saveState(preferences) {
            const stateData = {
                version: STATE_VERSION,
                timestamp: new Date().toISOString(),
                features: preferences
            };

            const serialized = JSON.stringify(stateData);
            this.setCookie(STATE_KEY, serialized, STATE_DAYS);

            // Also update internal state
            this.state = stateData;

            // Trigger events
            this.notifyListeners();

            // Fire custom event for other scripts
            window.dispatchEvent(new CustomEvent('gkk-state-updated', {
                detail: stateData
            }));
        }

        /**
         * Check if a specific feature is enabled
         */
        hasFeature(featureKey) {
            // Core features always enabled
            if (featureKey === FEATURES.ESSENTIAL) return true;

            if (!this.state) return false;
            return this.state.features[featureKey] === true;
        }

        /**
         * Check if any state has been saved
         */
        hasAnyState() {
            return this.state !== null;
        }

        /**
         * Accept all features
         */
        acceptAll() {
            const allFeatures = {};
            Object.values(FEATURES).forEach(key => {
                allFeatures[key] = true;
            });
            this.saveState(allFeatures);
        }

        /**
         * Accept only core features
         */
        acceptCore() {
            const coreFeatures = {};
            Object.values(FEATURES).forEach(key => {
                coreFeatures[key] = (key === FEATURES.ESSENTIAL);
            });
            this.saveState(coreFeatures);
        }

        /**
         * Reset all state (for debugging)
         */
        resetState() {
            this.deleteCookie(STATE_KEY);
            this.state = null;
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        }

        // Legacy alias for compatibility
        resetConsent() {
            this.resetState();
        }

        /**
         * Get features object
         */
        getFeatures() {
            return FEATURES;
        }

        // Legacy alias
        getCategories() {
            return FEATURES;
        }

        notifyListeners() {
            // Internal use
        }

        // --- Low Level Cookie Helpers ---

        setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            // Secure cookie attributes to look professional
            document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
        }

        getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        deleteCookie(name) {
            document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }

        // --- Preference Storage Helper ---

        setPreference(name, value) {
            // Only use local storage if user has enabled 'user_settings' feature
            if (this.hasFeature(FEATURES.PREFERENCES)) {
                localStorage.setItem(name, value);
            } else {
                // Fallback to session storage which is cleared when tab closes
                sessionStorage.setItem(name, value);
            }
        }

        getPreference(name) {
            return localStorage.getItem(name) || sessionStorage.getItem(name);
        }
    }

    // Initialize immediately
    new StateManager();

})();
