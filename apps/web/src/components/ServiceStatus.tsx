'use client'

import useSWR, { useSWRConfig } from 'swr'
import { usePreferences } from './SitePreferences'

/** A failed health check does not establish a cause such as a cold start. */
export function ServiceStatus({ service }: { service: 'abtest' | 'kpi' | 'portfolio' | 'ops' }) {
  const { t } = usePreferences()
  const { mutate } = useSWRConfig()
  const { data, error, isLoading } = useSWR(`/api/${service}/health`, async (url: string) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Service unavailable')
    return response.json()
  }, { errorRetryCount: 2, errorRetryInterval: 3000, revalidateOnFocus: false })
  if (data && !error) return null
  return <div className="service-status" role="status" aria-live="polite">
    <p>{error
      ? t('The analysis service is unavailable. You can still read the project context and methodology.', 'El servicio de análisis no está disponible. Puedes consultar el contexto y la metodología del proyecto.')
      : t('Connecting to the analysis service…', 'Conectando con el servicio de análisis…')}</p>
    {error && !isLoading && <button type="button" className="ui-button" onClick={() => {
      void mutate(key => typeof key === 'string' && key.startsWith(`/api/${service}/`), undefined, { revalidate: true })
    }}>{t('Retry', 'Reintentar')}</button>}
  </div>
}
