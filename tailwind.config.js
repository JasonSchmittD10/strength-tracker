/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0a0a0a',
          secondary: '#161616',
          tertiary:  '#222222',
          card:      '#1e1e1e',
          deep:      '#0a0a0a',
          stat:      '#181818',
          badge:     '#2f2f2f',
        },
        accent: {
          DEFAULT: '#f2a655',
          hover:   '#e3923b',
          dim:     'rgba(242,166,85,0.15)',
        },
        text: {
          primary:   '#ffffff',
          secondary: '#8b8b8b',
          muted:     '#5c5c5c',
        },
        push:    { DEFAULT: '#ff6b6b', dim: 'rgba(255,107,107,0.15)' },
        pull:    { DEFAULT: '#4ecdc4', dim: 'rgba(78,205,196,0.15)' },
        legs:    { DEFAULT: '#ffe66d', dim: 'rgba(255,230,109,0.15)' },
        success: '#4ade80',
        warning: '#fbbf24',
        danger:  '#f87171',
      },
      fontFamily: {
        sans:    ['Syne', 'system-ui', 'sans-serif'],
        judge:   ['"F37 Judge Trial"', 'system-ui', 'sans-serif'],
        commons: ['"TT Commons"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:   '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}
