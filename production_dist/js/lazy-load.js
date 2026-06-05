/**
 * Lazy Load System for Dashboard
 * Reveals sections as they scroll into view
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Image Lazy Loading Polyfill (if needed, but mostly relying on native loading="lazy")
    // This part ensures that if we have any custom logic or background images, we can handle them.

    // 2. Section Reveal Animation
    const observerOptions = {
        root: null, // viewport
        threshold: 0.1, // trigger when 10% visible
        rootMargin: "0px 0px -50px 0px" // offset a bit so it triggers before bottom
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Target elements
    const lazySections = document.querySelectorAll('.lazy-section');
    lazySections.forEach(section => {
        sectionObserver.observe(section);
    });
});
