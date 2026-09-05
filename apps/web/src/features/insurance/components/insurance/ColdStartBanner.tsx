'use client'

import { usePreferences } from '@/components/SitePreferences'

interface Props {
  anyLoading: boolean
  anyError: boolean
  allLoaded: boolean
}

export function ColdStartBanner({ anyLoading, anyError }: Props) {
  const { t } = usePreferences()
  if (!anyLoading && !anyError) return null
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4" role={anyError ? 'alert' : 'status'} aria-live="polite">
      <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
        {anyError
          ? t('Some analyses could not be loaded. Check the individual charts below.', 'No se pudieron cargar algunos análisis. Revisa las gráficas a continuación.')
          : t('Loading the selected analyses…', 'Cargando los análisis seleccionados…')}
      </p>
    </div>
  )
}
