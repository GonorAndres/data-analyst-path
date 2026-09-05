import type { Config } from 'tailwindcss'

const variables = [
  'paper', 'ink', 'surface', 'surface-hover', 'border', 'border-hover', 'muted', 'muted-dim', 'bg',
  'gain', 'loss', 'neutral', 'accent-blue', 'accent-amber', 'accent-indigo', 'benchmark',
  'us-equity', 'intl-equity', 'emerging', 'fixed-income', 'real-estate', 'commodities',
  'ops-bg', 'ops-surface', 'ops-surface-hover', 'ops-border', 'ops-text', 'ops-text-muted',
  'ops-blue', 'ops-cyan', 'ops-green', 'ops-amber', 'ops-red', 'ops-purple',
]
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries(variables.map(name => [name, `var(--${name})`])),
        accent: { DEFAULT: 'var(--accent)', hover: 'var(--accent-hover)', cyan: 'var(--accent-cyan)', violet: 'var(--accent-violet)' },
        navy: { 900: 'var(--background)', 800: 'var(--surface)', 700: 'var(--border)' },
        glass: { light: 'var(--surface)', medium: 'var(--surface-hover)' },
        status: { green: 'var(--status-green)', yellow: 'var(--status-yellow)', red: 'var(--status-red)' },
        revenue: 'var(--chart-revenue)', churn: 'var(--chart-churn)', forecast: 'var(--chart-forecast)', expansion: 'var(--chart-expansion)',
        'control-blue': 'var(--control)', 'treatment-green': 'var(--treatment)',
        'sig-positive': 'var(--sig-positive)', 'sig-negative': 'var(--sig-negative)', 'sig-inconclusive': 'var(--sig-neutral)',
        'accent-emerald': 'var(--gain)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
