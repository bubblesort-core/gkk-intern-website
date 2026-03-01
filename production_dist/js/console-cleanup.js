/**
 * GKK Interns Console Cleaner
 * Suppresses known third-party noise (Razorpay, Sentry, SES) related to ad-blockers.
 * Must run BEFORE other scripts.
 */
(function () {
    // Save original methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    // Filter patterns
    const IGNORED_ERRORS = [
        'SES Removing unpermitted intrinsics',
        'lockdown-install.js',
        'sentry-cdn',
        'lumberjack.razorpay',
        'otp-credentials',
        'ERR_BLOCKED_BY_CLIENT',
        'ERR_INVALID_URL',
        'x-rtb-fingerprint-id'
    ];

    function shouldSuppress(args) {
        // Convert all args to string to check content
        const msg = args.map(a => String(a)).join(' ');
        return IGNORED_ERRORS.some(pattern => msg.includes(pattern));
    }

    // Override console.error
    console.error = function (...args) {
        if (!shouldSuppress(args)) {
            originalError.apply(console, args);
        }
    };

    // Override console.warn
    console.warn = function (...args) {
        if (!shouldSuppress(args)) {
            originalWarn.apply(console, args);
        }
    };

    // Global Error Handler for uncaught exceptions
    window.addEventListener('error', function (e) {
        if (shouldSuppress([e.message, e.filename])) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);

    // Network Error Suppression (Try to catch standard resource load errors if they bubble)
    window.addEventListener('error', (event) => {
        if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT')) {
            // Check if source matches blocked domains
            const src = event.target.src || event.target.href;
            if (src && (src.includes('sentry') || src.includes('razorpay'))) {
                event.preventDefault();
            }
        }
    }, true);

})();
