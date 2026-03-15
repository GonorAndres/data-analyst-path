import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1A1A1E',
          800: '#242428',
          700: '#2E2E32',
        },
        glass: {
          light: 'rgba(255,255,250,0.04)',
          medium: 'rgba(255,255,250,0.08)',
        },
        accent: {
          cyan: '#3D8B8B',
          violet: '#B07242',
        },
        status: {
          green: '#4A8C6F',
          yellow: '#B8923E',
          red: '#B85450',
        },
        revenue: '#4A7CB5',
        churn: '#B85450',
        forecast: '#7B6EA5',
        expansion: '#4A8C6F',
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
