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
        paper: '#FAFAF8',
        ink: '#1A1A1A',
        'accent-indigo': '#3730A3',
        'accent-emerald': '#059669',
        surface: '#F0EFEB',
        border: '#E5E4DF',
        muted: '#6B6B6B',
        'control-blue': '#64748B',
        'treatment-green': '#059669',
        'sig-positive': '#16A34A',
        'sig-negative': '#DC2626',
        'sig-inconclusive': '#D97706',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-lora)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
