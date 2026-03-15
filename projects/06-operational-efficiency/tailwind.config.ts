import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ops-bg': '#0F0F0F',
        'ops-surface': '#171717',
        'ops-surface-hover': '#212121',
        'ops-border': '#2A2A2A',
        'ops-text': '#EDEBE8',
        'ops-text-muted': '#7A7670',
        'ops-blue': '#D4A15E',
        'ops-cyan': '#7EB8DA',
        'ops-green': '#6FCF97',
        'ops-amber': '#F2C94C',
        'ops-red': '#EB5757',
        'ops-purple': '#C084FC',
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
