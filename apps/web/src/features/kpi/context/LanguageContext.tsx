'use client'
import { createContext, useContext, ReactNode, useCallback } from 'react'
import { usePreferences } from '@/components/SitePreferences'
import { translations, TranslationKey } from '@/features/kpi/lib/translations'

type Language = 'en' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { locale: language, setLocale: setLanguage } = usePreferences()

  function toggleLanguage() {
    const next = language === 'en' ? 'es' : 'en'
    setLanguage(next)
  }

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key] || key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
