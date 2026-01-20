/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'os-bg': '#0f172a',
                'os-panel': '#1e293b',
                'os-accent': '#3b82f6',
                'os-hover': '#334155'
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
