/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'DM Sans',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        display: ['Outfit', 'DM Sans', 'sans-serif'],
      },
      colors: {
        flex: {
          bg: '#0c0f14',
          card: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.08)',
          muted: '#8b94a8',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35)',
        soft: '0 4px 24px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
