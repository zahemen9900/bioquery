/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep space colors
        space: {
          950: '#000814',
          900: '#020617',
          800: '#0f172a',
          700: '#1f2937',
          600: '#374151',
          500: '#6b7280',
          400: '#9ca3af',
          300: '#d1d5db',
          200: '#e5e7eb',
          100: '#f3f4f6',
          50: '#f9fafb',
        },
        // Bio-inspired accent colors
        biosphere: {
          600: '#00c795',
          500: '#00e7b3',
          400: '#33eeC1',
          300: '#66f3cf',
          200: '#99f7dd',
          100: '#ccfbeb',
        },
        // Purple accent (for variety)
        cosmic: {
          600: '#7c3aed',
          500: '#8b5cf6',
          400: '#a78bfa',
        },
        // Dynamic scheme colors (will be CSS variables)
        scheme: {
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          surfaceHover: 'var(--color-surface-hover)',
          border: 'var(--color-border)',
          borderSubtle: 'var(--color-border-subtle)',
          text: 'var(--color-text)',
          textMuted: 'var(--color-text-muted)',
          textSubtle: 'var(--color-text-subtle)',
          accent: 'var(--color-accent)',
          accentHover: 'var(--color-accent-hover)',
        },
      },
      spacing: {
        18: '4.5rem',
      },
      minHeight: {
        18: '4.5rem',
      },
      animation: {
        tabs: 'tabFade 350ms ease forwards',
      },
      keyframes: {
        tabFade: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1.5rem',
          md: '3rem',
        },
        screens: {
          '2xl': '1120px',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
