import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Custom hook for the Three.js "Emerald Core" hero 3D animation
 * Creates a rotating icosahedron with wireframe overlay and ambient particles
 */
export function useThreeHero() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Main geometry — Icosahedron "Emerald Core"
        const geometry = new THREE.IcosahedronGeometry(1.5, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0x10b981,
            transparent: true,
            opacity: 0.3,
            shininess: 100,
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Wireframe overlay
        const wireGeometry = new THREE.IcosahedronGeometry(1.55, 1);
        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
        });
        const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
        scene.add(wireMesh);

        // Ambient particles
        const particleCount = 50;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x3b82f6,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
        });
        const particles = new THREE.Points(particlesGeometry, particleMaterial);
        scene.add(particles);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x10b981, 1, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);
        const blueLight = new THREE.PointLight(0x3b82f6, 0.5, 100);
        blueLight.position.set(-5, -5, 5);
        scene.add(blueLight);

        // Animation
        let isVisible = true;
        let animationId;

        function animate() {
            if (!isVisible) return;
            animationId = requestAnimationFrame(animate);

            mesh.rotation.x += 0.003;
            mesh.rotation.y += 0.005;
            wireMesh.rotation.x -= 0.002;
            wireMesh.rotation.y -= 0.003;
            particles.rotation.y += 0.001;

            renderer.render(scene, camera);
        }

        // Intersection observer for performance
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting;
                if (isVisible) animate();
            },
            { threshold: 0 }
        );
        observer.observe(container);

        animate();

        // Resize handler
        function onResize() {
            if (!container) return;
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
        window.addEventListener('resize', onResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', onResize);
            observer.disconnect();
            cancelAnimationFrame(animationId);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            wireGeometry.dispose();
            wireMaterial.dispose();
            particlesGeometry.dispose();
            particleMaterial.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return containerRef;
}
