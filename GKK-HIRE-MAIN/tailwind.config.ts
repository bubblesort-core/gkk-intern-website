import type { Config } from 'tailwindcss'

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../shared/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'inter': ['Inter', 'sans-serif'],
                'cormorant': ['Cormorant Garamond', 'serif'],
            },
            colors: {
                'olive': '#6B7547',
                'champagne': '#F7E7CE',
                'ghost': '#F8F8F8',
            },
            backdropBlur: {
                'xs': '2px',
            },
            dropShadow: {
                'brutal': '8px 8px 0px rgba(0, 0, 0, 1)',
                'sharp': '6px 6px 0px rgba(0, 0, 0, 0.8)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'slide-up': 'slideUp 0.8s ease-out',
                'fade-in': 'fadeIn 1s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
} satisfies Config
