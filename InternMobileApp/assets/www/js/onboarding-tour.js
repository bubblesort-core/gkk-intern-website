/**
 * Onboarding Tour
 * First-time user walkthrough with highlighted tooltips
 */

(function () {
    'use strict';

    const TOUR_COMPLETE_KEY = 'gkk_onboarding_complete';
    const TOUR_VERSION = '1.0'; // Increment to force re-show

    // Tour step definitions
    const tourSteps = [
        {
            element: '#sidebar',
            title: '📍 Navigation',
            description: 'Use the sidebar to navigate between sections. The active page is highlighted.',
            position: 'right'
        },
        {
            element: '.stats-grid',
            title: '📊 Your Stats',
            description: 'Quick overview of your projects, completed tasks, and team size. Click any card to jump to that section.',
            position: 'bottom'
        },
        {
            element: '#streakCounter',
            title: '🔥 Daily Streak',
            description: 'Check in every day to build your streak and earn XP! Higher streaks = more rewards.',
            position: 'bottom'
        },
        {
            element: '[data-section="profile"]',
            title: '👤 Your Profile',
            description: 'Complete your profile to help your team and mentors know you better.',
            position: 'right'
        },
        {
            element: '[data-section="projects"]',
            title: '🚀 Projects',
            description: 'View your assigned projects, submit work, and track approval status.',
            position: 'right'
        },
        {
            element: '[data-section="team"]',
            title: '👥 Team Chat',
            description: 'Collaborate with your team in real-time. Share updates and ask questions!',
            position: 'right'
        }
    ];

    let currentStep = 0;
    let overlay = null;
    let tooltip = null;

    // Check if tour should show
    function shouldShowTour() {
        // Try to get from cookie first, then localStorage
        let stored = null;
        if (window.CookieManager) {
            stored = window.CookieManager.getPreference(TOUR_COMPLETE_KEY);
        } else {
            stored = localStorage.getItem(TOUR_COMPLETE_KEY);
        }

        if (!stored) return true;

        try {
            const data = JSON.parse(stored);
            return data.version !== TOUR_VERSION;
        } catch {
            return true;
        }
    }

    // Mark tour as complete
    function completeTour() {
        const tourData = JSON.stringify({
            completed: true,
            version: TOUR_VERSION,
            date: new Date().toISOString()
        });

        // Use CookieManager if available and consent given, otherwise localStorage
        if (window.CookieManager) {
            window.CookieManager.setPreference(TOUR_COMPLETE_KEY, tourData, 365);
        } else {
            localStorage.setItem(TOUR_COMPLETE_KEY, tourData);
        }
    }

    // Create overlay
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'tourOverlay';
        overlay.innerHTML = `
            <style>
                #tourOverlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9998;
                    pointer-events: none;
                }
                .tour-spotlight {
                    position: absolute;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    pointer-events: auto;
                }
                .tour-tooltip {
                    position: absolute;
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 12px;
                    padding: 20px;
                    max-width: 320px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                    z-index: 9999;
                    pointer-events: auto;
                }
                .tour-tooltip h3 {
                    color: #f8fafc;
                    font-size: 1.1rem;
                    margin: 0 0 8px 0;
                    font-weight: 600;
                }
                .tour-tooltip p {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin: 0 0 16px 0;
                }
                .tour-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .tour-progress {
                    color: #64748b;
                    font-size: 0.8rem;
                }
                .tour-btn {
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                .tour-btn-skip {
                    background: transparent;
                    color: #94a3b8;
                }
                .tour-btn-skip:hover {
                    color: #f8fafc;
                }
                .tour-btn-next {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                }
                .tour-btn-next:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                }
                .tour-arrow {
                    position: absolute;
                    width: 0;
                    height: 0;
                }
                .tour-arrow-left {
                    right: 100%;
                    top: 24px;
                    border-top: 8px solid transparent;
                    border-bottom: 8px solid transparent;
                    border-right: 8px solid #1e293b;
                }
                .tour-arrow-top {
                    bottom: 100%;
                    left: 24px;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-bottom: 8px solid #1e293b;
                }
            </style>
        `;
        document.body.appendChild(overlay);
    }

    // Show step
    function showStep(index) {
        if (index >= tourSteps.length) {
            endTour();
            return;
        }

        currentStep = index;
        const step = tourSteps[index];
        const element = document.querySelector(step.element);

        if (!element) {
            // Skip if element not found
            showStep(index + 1);
            return;
        }

        // Clear previous
        const oldSpotlight = overlay.querySelector('.tour-spotlight');
        const oldTooltip = overlay.querySelector('.tour-tooltip');
        if (oldSpotlight) oldSpotlight.remove();
        if (oldTooltip) oldTooltip.remove();

        // Get element position
        const rect = element.getBoundingClientRect();
        const padding = 8;

        // Create spotlight
        const spotlight = document.createElement('div');
        spotlight.className = 'tour-spotlight';
        spotlight.style.cssText = `
            left: ${rect.left - padding}px;
            top: ${rect.top - padding}px;
            width: ${rect.width + padding * 2}px;
            height: ${rect.height + padding * 2}px;
        `;
        overlay.appendChild(spotlight);

        // Create tooltip
        tooltip = document.createElement('div');
        tooltip.className = 'tour-tooltip';
        tooltip.innerHTML = `
            <div class="tour-arrow tour-arrow-${step.position === 'right' ? 'left' : 'top'}"></div>
            <h3>${step.title}</h3>
            <p>${step.description}</p>
            <div class="tour-actions">
                <span class="tour-progress">${index + 1} of ${tourSteps.length}</span>
                <div>
                    <button class="tour-btn tour-btn-skip" onclick="skipTour()">Skip</button>
                    <button class="tour-btn tour-btn-next" onclick="nextTourStep()">
                        ${index === tourSteps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        `;

        // Position tooltip
        if (step.position === 'right') {
            tooltip.style.left = `${rect.right + 16}px`;
            tooltip.style.top = `${rect.top}px`;
        } else if (step.position === 'bottom') {
            tooltip.style.left = `${rect.left}px`;
            tooltip.style.top = `${rect.bottom + 16}px`;
        }

        overlay.appendChild(tooltip);

        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Next step
    function nextStep() {
        showStep(currentStep + 1);
    }

    // Skip tour
    function skipTour() {
        endTour();
    }

    // End tour
    function endTour() {
        completeTour();
        if (overlay) {
            overlay.remove();
            overlay = null;
        }

        // Show completion message
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '🎉 You\'re all set!',
                text: 'Start exploring your dashboard. Click the ? icon anytime to restart the tour.',
                icon: 'success',
                confirmButtonColor: '#6366f1',
                timer: 3000,
                timerProgressBar: true
            });
        }
    }

    // Start tour
    function startTour() {
        createOverlay();
        currentStep = 0;
        showStep(0);
    }

    // Restart tour
    function restartTour() {
        // Remove from both cookie and localStorage
        if (window.CookieManager) {
            window.CookieManager.deletePreference(TOUR_COMPLETE_KEY);
        } else {
            localStorage.removeItem(TOUR_COMPLETE_KEY);
        }
        startTour();
    }

    // Initialize
    function initOnboardingTour() {
        // Add help button to header if not exists
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.getElementById('tourHelpBtn')) {
            const helpBtn = document.createElement('button');
            helpBtn.id = 'tourHelpBtn';
            helpBtn.title = 'Restart Tour';
            helpBtn.style.cssText = `
                background: transparent;
                border: 1px solid rgba(255,255,255,0.1);
                color: var(--text-secondary);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.9rem;
            `;
            helpBtn.innerHTML = '<i class="fas fa-question"></i>';
            helpBtn.onclick = restartTour;
            headerActions.insertBefore(helpBtn, headerActions.firstChild);
        }

        // Auto-start tour for first-time users
        if (shouldShowTour()) {
            setTimeout(startTour, 1500); // Delay to let page load
        }
    }

    // Expose globally
    window.startOnboardingTour = startTour;
    window.restartOnboardingTour = restartTour;
    window.nextTourStep = nextStep;
    window.skipTour = skipTour;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOnboardingTour);
    } else {
        setTimeout(initOnboardingTour, 500);
    }
})();
