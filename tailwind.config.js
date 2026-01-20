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
      colors: {
        primary: {
          DEFAULT: '#7033ff',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#edf0f4',
          foreground: '#080808',
        },
        accent: {
          DEFAULT: '#e2ebff',
          foreground: '#1e69dc',
        },
        background: '#fdfdfd',
        foreground: '#000000',
        card: {
          DEFAULT: '#fdfdfd',
          foreground: '#000000',
        },
        popover: {
          DEFAULT: '#fcfcfc',
          foreground: '#000000',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#525252',
        },
        destructive: {
          DEFAULT: '#e54b4f',
          foreground: '#ffffff',
        },
        border: '#e7e7ee',
        input: '#ebebeb',
        ring: '#000000',
        chart: {
          1: '#4ac885',
          2: '#7033ff',
          3: '#fd822b',
          4: '#3276e4',
          5: '#747474',
        },
        sidebar: {
          DEFAULT: '#f5f8fb',
          foreground: '#000000',
          primary: '#000000',
          'primary-foreground': '#ffffff',
          accent: '#ebebeb',
          'accent-foreground': '#000000',
          border: '#ebebeb',
          ring: '#000000',
        },
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
