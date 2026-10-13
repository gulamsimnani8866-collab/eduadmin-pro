/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f0fb',
          100: '#c5d8f5',
          200: '#9dbdee',
          300: '#72a0e7',
          400: '#508ae2',
          500: '#2d74dd',
          600: '#1e5fbf',
          700: '#0F2E5A',   // primary sidebar bg
          800: '#0a1f3f',
          900: '#050f20',
        },
        accent: {
          400: '#3b82f6',
          500: '#2563eb',
          600: '#1d4ed8',
        },
        success: { 500: '#22c55e', 600: '#16a34a' },
        warning: { 500: '#f59e0b', 600: '#d97706' },
        danger:  { 500: '#ef4444', 600: '#dc2626' },
      },
      fontFamily: {
        sans:    ['Sora', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)',
        modal: '0 8px 48px rgba(0,0,0,.18)',
        sidebar: '2px 0 8px rgba(0,0,0,.12)',
      },
    },
  },
  plugins: [],
}
