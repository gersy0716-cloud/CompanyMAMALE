/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem'
            },
            backdropBlur: {
                '4xl': '80px'
            }
        }
    },
    plugins: []
}
