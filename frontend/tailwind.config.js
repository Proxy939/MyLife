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
            }
        },
    },
    plugins: [],
}
