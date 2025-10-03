import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#020617',
          800: '#111827',
          700: '#1f2937',
          100: '#e2e8f0',
        },
        biosphere: {
          500: '#00e7b3',
          600: '#00c795',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
