import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        ink: 'var(--ink)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        muted: 'var(--muted)',
        'muted-dim': 'var(--muted-dim)',
        gain: 'var(--gain)',
        loss: 'var(--loss)',
        neutral: 'var(--neutral)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-blue': 'var(--accent-blue)',
        benchmark: 'var(--benchmark)',
        'us-equity': 'var(--us-equity)',
        'intl-equity': 'var(--intl-equity)',
        emerging: 'var(--emerging)',
        'fixed-income': 'var(--fixed-income)',
        'real-estate': 'var(--real-estate)',
        commodities: 'var(--commodities)',
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(155, 125, 200, 0.15)',
        'glow-violet-lg': '0 0 40px rgba(155, 125, 200, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config
