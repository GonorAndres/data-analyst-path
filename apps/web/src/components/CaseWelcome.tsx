'use client'

import { ArrowDown } from 'lucide-react'
import { caseIntroductions } from '@/lib/case-introductions'
import { usePreferences } from './SitePreferences'

export function CaseWelcome({ introductionId }: { introductionId: string }) {
  const { locale, t } = usePreferences()
  const introduction = caseIntroductions[introductionId]
  if (!introduction) return null

  return <section className="case-welcome" aria-labelledby="case-welcome-title">
    <div className="case-welcome-copy">
      <p className="eyebrow">{t('The question behind this project', 'La pregunta detrás de este proyecto')}</p>
      <h2 id="case-welcome-title">{introduction.title[locale]}</h2>
      <p className="case-welcome-description">{introduction.description[locale]}</p>
      <a className="primary-link" href="#case-analysis">{t('Read the analysis', 'Leer el análisis')}<ArrowDown size={17} aria-hidden="true" /></a>
    </div>
    <figure className="case-welcome-art">
      {/* Static responsive assets keep the exported site independent of an image service. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/cases/${introduction.image}-1200.webp`} srcSet={`/images/cases/${introduction.image}-640.webp 640w, /images/cases/${introduction.image}-1200.webp 1200w`} sizes="(max-width: 767px) calc(100vw - 40px), 50vw" width={1536} height={1024} alt={introduction.alt[locale]} fetchPriority="high" />
    </figure>
  </section>
}
