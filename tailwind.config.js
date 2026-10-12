/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F5F2EC',
        charcoal: '#242724',
        bronze: '#A78B64',
        stone: {
          50: '#FAF9F6',
          100: '#EFECE5',
          200: '#E3DFD6',
          300: '#CFCABF',
          400: '#A9A49A',
          500: '#8A857C',
          600: '#6E6A62',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        eyebrow: '0.22em',
        wide2: '0.14em',
      },
      fontSize: {
        'display-sm': ['2.25rem', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        'display': ['3rem', { lineHeight: '1.04', letterSpacing: '-0.015em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'display-xl': ['4.75rem', { lineHeight: '0.98', letterSpacing: '-0.025em' }],
      },
      maxWidth: {
        shell: '84rem',
        prose: '68ch',
      },
      spacing: {
        section: '5.5rem',
        'section-lg': '8rem',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        'rise-in': {
          '0%': { opacity: '0', transform: 'translate3d(0, 1.25rem, 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'fade-in': 'fade-in 1.2s ease-out both',
        'scale-in': 'scale-in 1.4s cubic-bezier(0.22, 0.61, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
