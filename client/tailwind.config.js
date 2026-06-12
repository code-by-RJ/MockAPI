/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent:          '#22d3ee',
        border:          '#151823',
        'bg-primary':    '#050608',
        'bg-card':       '#0a0c14',
        'bg-surface':    '#0e1018',
        'txt-primary':   '#e2e4f0',
        'txt-secondary': '#8b90a8',
        'txt-muted':     '#3d4159',
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}