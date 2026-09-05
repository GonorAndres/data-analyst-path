'use client'

import { usePreferences } from '@/components/SitePreferences'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = usePreferences()
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-paper text-ink" role="alert">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">{t('This analysis could not be displayed.', 'No se pudo mostrar este análisis.')}</h2>
        <p className="text-muted">{t('Please try again or choose another project from the navigation.', 'Intenta de nuevo o elige otro proyecto en la navegación.')}</p>
        <button
          onClick={reset}
          className="ui-button"
        >
          {t('Try again', 'Reintentar')}
        </button>
      </div>
    </div>
  )
}
