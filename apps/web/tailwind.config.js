/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface colors
        surface: {
          bg: '#f5f7fb',
          panel: '#ffffff',
          border: '#e1e7f0',
        },
        // Text colors
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#64748b',
        },
        // Brand colors
        accent: {
          DEFAULT: '#2563eb',
          strong: '#1d4ed8',
        },
        // Status colors for initiatives
        status: {
          'on-track': '#22c55e',
          'at-risk': '#f97316',
          'blocked': '#ef4444',
          'complete': '#0ea5e9',
          'archived': '#94a3b8',
        },
        // Health indicators
        health: {
          healthy: '#10b981',
          watch: '#facc15',
          critical: '#dc2626',
        },
        // Risk levels
        risk: {
          low: '#cbd5f5',
          medium: '#facc15',
          high: '#fb923c',
          critical: '#f87171',
        },
        // SOW status colors
        sow: {
          draft: '#cbd5f5',
          review: '#facc15',
          approved: '#60a5fa',
          signed: '#22c55e',
        },
        // Chip colors
        chip: {
          background: '#e2e8f0',
          active: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        'card': '0 4px 16px -12px rgba(15, 23, 42, 0.35)',
        'panel': '0 6px 20px -16px rgba(15, 23, 42, 0.25)',
        'header': '0 12px 32px -20px rgba(30, 64, 175, 0.5)',
        'button': '0 8px 20px -10px rgba(37, 99, 235, 0.45)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        'gradient-header': 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        'gradient-button': 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
        'gradient-danger': 'linear-gradient(135deg, #ef4444, #b91c1c)',
        'gradient-secondary': 'linear-gradient(135deg, #1f2937, #111827)',
        'gradient-card': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      gridTemplateColumns: {
        'board': 'repeat(6, minmax(220px, 1fr))',
        'board-lg': 'repeat(3, minmax(220px, 1fr))',
        'board-md': 'repeat(2, minmax(220px, 1fr))',
        'board-sm': 'repeat(1, minmax(220px, 1fr))',
        'metrics': 'repeat(3, minmax(0, 1fr))',
        'form': 'repeat(3, minmax(0, 1fr))',
        'form-md': 'repeat(2, minmax(0, 1fr))',
      },
      maxHeight: {
        'board': '720px',
      },
      minWidth: {
        'board-column': '220px',
      },
    },
  },
  plugins: [],
}