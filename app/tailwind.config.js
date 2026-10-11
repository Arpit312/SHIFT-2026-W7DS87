/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0B',
        surface: '#111113',
        elevated: '#18181B',
        'cn-border': '#2A2A2F',
        'text-primary': '#F4F1EA',
        'text-muted': '#A3A3AD',
        'brand-orange': '#FF7A1A',
        'brand-orange-hover': '#FF9142',
        gold: '#D9A93C',
        'gold-bg': '#2E260F',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#22C55E',
        info: '#38BDF8',
      },
    },
  },
  plugins: [],
}
