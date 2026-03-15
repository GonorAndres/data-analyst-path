'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('kpi-theme')
    // Dark-first: default to dark unless explicitly set to light
    const isDark = stored !== 'light'
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('kpi-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className="p-2.5 glass-card hover:bg-[var(--glass-medium)] transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={16} className="text-[var(--accent-cyan)]" /> : <Moon size={16} className="text-[var(--accent-violet)]" />}
    </button>
  )
}
