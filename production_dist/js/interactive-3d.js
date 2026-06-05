/**
 * GKK Interns Interactive 3D & Micro-interactions
 * Concept: Minimalist, Smooth, Non-intrusive
 */

class InteractiveExperience {
    constructor() {
        this.initThreeJS();
        this.initTiltCards();
        this.initMagneticButtons();
        this.initBackgroundAmbience();
        this.initIntersectionObserver();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    // ==========================================
    // 1. THREE.JS HERO ELEMENT (The "Emerald Core")
    // ==========================================
    initThreeJS() {
        const container = document.getElementById('hero-3d-container');
        if (!container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });

        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize performance
        container.appendChild(this.renderer.domElement);

        // Geometries
        // Main Shape: Icosahedron for geometric minimalism
        const geometry = new THREE.IcosahedronGeometry(2, 0);

        // Material: Glass-like feeling
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x10b981,        // Emerald
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.6,      // Glass effect
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        // SMART FIX: Offset the object so it's not hidden behind the cards
        // Canvas is now larger (150%), so coordinate system is wider.
        this.mesh.position.set(2.5, 1.0, 0);
        this.mesh.scale.set(2.0, 2.0, 2.0);

        this.scene.add(this.mesh);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0x10b981, 2);
        pointLight2.position.set(-5, -5, 2);
        this.scene.add(pointLight2);

        this.camera.position.z = 6;

        // Interaction State
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;

        document.addEventListener('mousemove', (e) => {
            const windowHalfX = window.innerWidth / 2;
            const windowHalfY = window.innerHeight / 2;
            this.mouseX = (e.clientX - windowHalfX) / 100;
            this.mouseY = (e.clientY - windowHalfY) / 100;
        });

        // Animation Loop
        this.animate();
    }

    animate() {
        if (!this.mesh) return;

        requestAnimationFrame(() => this.animate());

        // Smooth rotation interacting with mouse
        this.targetRotationX = this.mouseY * 0.5;
        this.targetRotationY = this.mouseX * 0.5;

        // Linear interpolation for smoothness (lerp)
        this.mesh.rotation.x += 0.05 * (this.targetRotationX - this.mesh.rotation.x) + 0.002; // +0.002 for constant subtle spin
        this.mesh.rotation.y += 0.05 * (this.targetRotationY - this.mesh.rotation.y) + 0.002;

        // Floating effect
        const time = Date.now() * 0.001;
        this.mesh.position.y = Math.sin(time) * 0.2;

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        const container = document.getElementById('hero-3d-container');
        if (container) {
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        }
    }

    // ==========================================
    // OPTIMIZATION: Intersection Observer
    // ==========================================
    initIntersectionObserver() {
        const container = document.getElementById('hero-3d-container');
        if (!container) return;

        this.isVisible = true;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                if (this.isVisible) {
                    // Resume if stopped
                    if (!this.animationFrameId) this.animate();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(container);
    }

    animate() {
        if (!this.mesh || !this.isVisible) {
            this.animationFrameId = null;
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());

        // Smooth rotation interacting with mouse
        this.targetRotationX = this.mouseY * 0.5;
        this.targetRotationY = this.mouseX * 0.5;

        // Linear interpolation for smoothness (lerp)
        this.mesh.rotation.x += 0.05 * (this.targetRotationX - this.mesh.rotation.x) + 0.002;
        this.mesh.rotation.y += 0.05 * (this.targetRotationY - this.mesh.rotation.y) + 0.002;

        // Floating effect
        const time = Date.now() * 0.001;
        this.mesh.position.y = Math.sin(time) * 0.2;

        this.renderer.render(this.scene, this.camera);
    }


    // ==========================================
    // 2. 3D TILT CARDS (CSS Transform)
    // ==========================================
    initTiltCards() {
        const cards = document.querySelectorAll('.hero-card, .feature-card, .stat-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Calculate percentage from center (0 to 1) -> (-1 to 1)
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5; // Max 5 deg rotation
                const rotateY = ((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                card.style.transition = 'transform 0.1s ease'; // Fast response for movement
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                card.style.transition = 'transform 0.5s ease'; // Smooth return
            });
        });
    }

    // ==========================================
    // 3. MAGNETIC BUTTONS
    // ==========================================
    initMagneticButtons() {
        const buttons = document.querySelectorAll('.magnetic-btn');

        buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Move button slightly towards cursor
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
                btn.style.transition = 'transform 0.1s ease';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
                btn.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'; // Elastic bounce back
            });
        });
    }

    // ==========================================
    // 4. AMBIENT BACKGROUND
    // ==========================================
    initBackgroundAmbience() {
        // Find existing canvas or create one
        let canvas = document.getElementById('ambient-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'ambient-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '-10';
            canvas.style.pointerEvents = 'none'; // Click through
            canvas.style.opacity = '0.4'; // Subtle
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5; // Very slow
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 200 + 100; // Large soft blobs
                this.color = Math.random() > 0.5 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(59, 130, 246, 0.03)'; // Emerald/Blue
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Wrap around screen
                if (this.x < -this.size) this.x = width + this.size;
                if (this.x > width + this.size) this.x = -this.size;
                if (this.y < -this.size) this.y = height + this.size;
                if (this.y > height + this.size) this.y = -this.size;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < 6; i++) { // Few particles for minimalism
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        initParticles();
        animate();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveExperience();
});
