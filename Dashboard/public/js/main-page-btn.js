/* Main Page Floating Button — auto-injects a small floating button
   that takes the user back to the Dashboard landing page.
   Skips rendering on the landing page itself. */

// Wrapped in DOMContentLoaded to ensure sidebar detection works
document.addEventListener('DOMContentLoaded', () => {
    // Don't render on the landing page itself
    const path = window.location.pathname.replace(/\/+$/, '');
    const segments = path.split('/');
    const fileName = segments.pop() || '';
    const parentDir = segments.pop() || '';

    // Skip if we're already on the Dashboard landing (Dashboard/index.html or Dashboard/)
    const isLanding =
        (fileName === 'index.html' || fileName === '') &&
        parentDir.toLowerCase() === 'dashboard';
    if (isLanding) return;

    // Skip if sidebar exists (user dashboard)
    if (document.getElementById('sidebar')) return;

    // Compute href from the script tag's own src path
    // The script is always at js/main-page-btn.js relative to Dashboard/
    const scripts = document.querySelectorAll('script[src*="main-page-btn"]');
    const scriptSrc = scripts.length ? scripts[scripts.length - 1].getAttribute('src') : '';
    // scriptSrc is like "../js/main-page-btn.js" or "js/main-page-btn.js"
    // Strip "js/main-page-btn.js" to get the base prefix
    const base = scriptSrc.replace(/js\/main-page-btn\.js$/, '');
    const href = base + 'index.html';


    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        #gkk-main-page-btn {
            position: fixed;
            top: 16px;
            right: 20px;
            height: 38px;
            padding: 0 16px;
            border: none;
            border-radius: 10px;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            z-index: 9990;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25),
                        0 0 0 1px rgba(255, 255, 255, 0.06);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            text-decoration: none;
            letter-spacing: 0.2px;
            opacity: 0;
            transform: translateY(-8px);
            animation: gkkMainBtnIn 0.4s 0.6s forwards;
        }
        @keyframes gkkMainBtnIn {
            to { opacity: 1; transform: translateY(0); }
        }
        #gkk-main-page-btn:hover {
            transform: translateY(-1px) scale(1.03);
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35),
                        0 0 0 1px rgba(255, 255, 255, 0.1);
            background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
        }
        #gkk-main-page-btn:active {
            transform: scale(0.97);
        }
        #gkk-main-page-btn i {
            font-size: 13px;
            opacity: 0.8;
        }
        @media (max-width: 768px) {
            #gkk-main-page-btn {
                top: 12px;
                right: 12px;
                height: 34px;
                padding: 0 12px;
                font-size: 11.5px;
            }
        }
    `;
    document.head.appendChild(style);

    // Inject button
    const btn = document.createElement('a');
    btn.id = 'gkk-main-page-btn';
    btn.href = href;
    btn.innerHTML = '<i class="fas fa-home"></i> Main Page';
    btn.title = 'Go to Dashboard Landing';
    document.body.appendChild(btn);
});
