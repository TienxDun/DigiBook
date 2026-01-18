/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'sans-serif'],
      },
      fontSize: {
        'micro': '11px',
        'label': '13px',
      },
      letterSpacing: {
        'premium': '0.15em',
        'ultra': '0.25em',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
