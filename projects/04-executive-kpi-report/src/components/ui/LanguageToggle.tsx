'use client'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-3 py-2 glass-card hover:bg-[var(--glass-medium)] transition-colors text-sm font-medium"
      aria-label="Toggle language"
    >
      <Globe size={14} className="text-[var(--accent-cyan)]" />
      <span className="text-[var(--fg-secondary)] uppercase tracking-wider text-xs">
        {language}
      </span>
    </button>
  )
}
