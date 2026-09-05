'use client'

import Link from 'next/link'
import { usePreferences } from '@/components/SitePreferences'

export default function NotFound() {
  const { t } = usePreferences()
  return <main className="not-found"><p className="eyebrow">404</p><h1>{t('This page is not here.', 'Esta página no existe.')}</h1><p>{t('Explore the case studies to find your next analysis.', 'Explora los casos de estudio para encontrar el análisis que buscas.')}</p><Link className="primary-link" href="/">{t('Back to the portfolio', 'Volver al portafolio')}</Link></main>
}
