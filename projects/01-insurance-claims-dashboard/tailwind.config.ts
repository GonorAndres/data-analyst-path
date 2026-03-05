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
        'accent-blue': '#1E3A5F',
        'accent-amber': '#C4841D',
        surface: '#F0EFEB',
        border: '#E5E4DF',
        muted: '#6B6B6B',
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
