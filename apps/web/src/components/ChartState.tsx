'use client'

import { usePreferences } from './SitePreferences'

export function ChartState({ loading, error, empty, retry, children }: {
  loading?: boolean; error?: unknown; empty?: boolean; retry?: () => void; children?: React.ReactNode
}) {
  const { t } = usePreferences()
  if (error) return <div className="chart-state" role="alert">
    <p>{t('This analysis could not be loaded.', 'No se pudo cargar este análisis.')}</p>
    {retry && <button className="ui-button" type="button" onClick={retry}>{t('Try again', 'Reintentar')}</button>}
  </div>
  if (loading) return <div className="chart-state" role="status" aria-live="polite">
    <span className="loading-mark" aria-hidden="true" />{t('Loading analysis…', 'Cargando análisis…')}
  </div>
  if (empty) return <div className="chart-state" role="status">{t('No data matches these filters.', 'No hay datos para estos filtros.')}</div>
  return <>{children}</>
}
