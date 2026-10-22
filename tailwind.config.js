/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  // Built dynamically by <Button variant="…">
  safelist: ['btn-primary', 'btn-secondary', 'btn-ghost', 'btn-danger'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        'toast-in': { from: { opacity: 0, transform: 'translateX(24px) scale(.97)' }, to: { opacity: 1, transform: 'none' } },
        'toast-bar': { from: { width: '100%' }, to: { width: '0%' } },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out',
        'toast-in': 'toast-in .25s cubic-bezier(.2,.8,.2,1)',
        'toast-bar': 'toast-bar linear forwards',
      },
    },
  },
  plugins: [],
}
