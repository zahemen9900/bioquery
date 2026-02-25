import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#020617',
          800: '#0F172A',
          700: '#1E293B',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
        biosphere: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        accent: {
          teal: '#00e7b3',
          purple: '#8b5cf6',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-sm': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'neon-teal': '0 0 10px rgba(0, 231, 179, 0.4), 0 0 20px rgba(0, 231, 179, 0.2)',
        'neon-purple': '0 0 10px rgba(139, 92, 246, 0.4), 0 0 20px rgba(139, 92, 246, 0.2)',
        'neon-blue': '0 0 10px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.2)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(2, 6, 23, 0.7) 0%, rgba(2, 6, 23, 0.4) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config
