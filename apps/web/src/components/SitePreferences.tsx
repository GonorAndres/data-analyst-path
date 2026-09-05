'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'en' | 'es'
export type Theme = 'light' | 'dark'
type Preferences = {
  locale: Locale
  theme: Theme
  setLocale: (locale: Locale) => void
  setTheme: (theme: Theme) => void
  t: (english: string, spanish: string) => string
}
const Context = createContext<Preferences | null>(null)
export const LOCALE_KEY = 'analyst-locale'
export const THEME_KEY = 'analyst-theme'

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export function SitePreferences({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<Locale>('en')
  const [theme, updateTheme] = useState<Theme>('light')

  useEffect(() => {
    function restore() {
      try {
        const savedLocale = localStorage.getItem(LOCALE_KEY)
        const savedTheme = localStorage.getItem(THEME_KEY) ?? localStorage.getItem('theme') ?? localStorage.getItem('kpi-theme')
        if (savedLocale === 'en' || savedLocale === 'es') updateLocale(savedLocale)
        if (savedTheme === 'light' || savedTheme === 'dark') { applyTheme(savedTheme); updateTheme(savedTheme) }
      } catch { /* Preferences remain usable when browser storage is disabled. */ }
    }
    restore()
    window.addEventListener('storage', restore)
    return () => window.removeEventListener('storage', restore)
  }, [])

  useEffect(() => { document.documentElement.lang = locale }, [locale])

  const value = useMemo<Preferences>(() => ({
    locale, theme,
    setLocale(next) {
      updateLocale(next)
      try { localStorage.setItem(LOCALE_KEY, next) } catch {}
    },
    setTheme(next) {
      applyTheme(next)
      updateTheme(next)
      try { localStorage.setItem(THEME_KEY, next) } catch {}
    },
    t: (english, spanish) => locale === 'en' ? english : spanish,
  }), [locale, theme])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePreferences() {
  const context = useContext(Context)
  if (!context) throw new Error('usePreferences requires SitePreferences')
  return context
}
