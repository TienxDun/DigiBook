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
        'label': '12px',
        'xs': ['12px', { lineHeight: '1.25rem' }],
        'sm': ['14px', { lineHeight: '1.5rem' }],
        'base': ['16px', { lineHeight: '1.75rem' }],
        'lg': ['18px', { lineHeight: '1.75rem' }],
        'xl': ['20px', { lineHeight: '1.75rem' }],
        '2xl': ['24px', { lineHeight: '2.25rem' }],
        '3xl': ['30px', { lineHeight: '2.5rem' }],
        '4xl': ['36px', { lineHeight: '3rem' }],
      },
      letterSpacing: {
        'premium': '0.15em',
        'ultra': '0.25em',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
}
