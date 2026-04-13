/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0f1117',
          secondary: '#1a1d27',
          tertiary:  '#22263a',
          card:      '#1e2235',
        },
        accent: {
          DEFAULT: '#f2a655',
          hover:   '#e3923b',
          dim:     'rgba(242,166,85,0.15)',
        },
        text: {
          primary:   '#f0f2ff',
          secondary: '#8b8fa8',
          muted:     '#5a5e7a',
        },
        push:    { DEFAULT: '#ff6b6b', dim: 'rgba(255,107,107,0.15)' },
        pull:    { DEFAULT: '#4ecdc4', dim: 'rgba(78,205,196,0.15)' },
        legs:    { DEFAULT: '#ffe66d', dim: 'rgba(255,230,109,0.15)' },
        success: '#4ade80',
        warning: '#fbbf24',
        danger:  '#f87171',
      },
      fontFamily: {
        sans: ['Syne', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:   '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}
