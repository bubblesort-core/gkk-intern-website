class TransitionManager {
    constructor() {
        this.overlay = null;
        this.iconContainer = null;
        this.progressBar = null;
        this.isAnimating = false;

        // Pre-bind init to ensure it runs
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        if (document.getElementById('transition-overlay')) return;

        // Create overlay DOM structure
        const overlay = document.createElement('div');
        overlay.id = 'transition-overlay';
        overlay.innerHTML = `
            <div class="transition-icon-container" id="transition-icon">
                <!-- Icon injected here -->
            </div>
            <div class="transition-progress-container">
                <div class="transition-progress-bar" id="transition-bar"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.iconContainer = document.getElementById('transition-icon');
        this.progressBar = document.getElementById('transition-bar');
    }

    /**
     * Shows the transition animation and then executes the callback (redirect).
     * @param {string} type - 'login' | 'apply' | 'community'
     * @param {function} callback - Function to execute after animation (e.g., redirect)
     */
    async show(type, callback) {
        if (!this.overlay) this.init();
        this.isAnimating = true;

        // 1. Setup Icon
        let iconHtml = '';
        if (type === 'login') {
            iconHtml = '<i class="fas fa-lock" id="anim-icon"></i>';
        } else if (type === 'apply') {
            iconHtml = '<i class="fas fa-paper-plane" id="anim-icon"></i>';
        } else if (type === 'community') {
            iconHtml = '<i class="fas fa-users" id="anim-icon"></i>'; // or project-diagram
        }

        this.iconContainer.innerHTML = iconHtml;
        const iconEl = document.getElementById('anim-icon');

        // 2. Show Overlay
        this.overlay.classList.add('active');
        this.progressBar.style.width = '0%';

        // 3. Play Specific Animation
        if (type === 'login') {
            // Shake then Unlock
            iconEl.classList.add('anim-lock-shake');
            await this.wait(400);
            iconEl.classList.remove('anim-lock-shake');
            iconEl.classList.add('fas', 'fa-lock-open'); // Switch icon
            iconEl.classList.add('anim-lock-unlock');
        } else if (type === 'apply') {
            // Fly away
            await this.wait(200);
            iconEl.classList.add('anim-plane-fly');
        } else if (type === 'community') {
            // Pulse
            iconEl.classList.add('anim-nodes-pulse');
        }

        // 4. Simulate Progress Bar (0 -> 90%)
        await this.simulateProgress(90, 800); // Target 90% over 800ms

        // 5. Execute Callback (Redirect)
        if (callback) callback();

        // Note: The new page load will naturally replace this one. 
        // If it's a SPA or no reload, we'd need a hide() method.
    }

    simulateProgress(targetPercent, duration) {
        return new Promise(resolve => {
            let start = 0;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const ease = 1 - Math.pow(1 - progress, 3);

                const currentPercent = start + (targetPercent - start) * ease;
                this.progressBar.style.width = `${currentPercent}%`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export global instance
window.TransitionManager = new TransitionManager();
