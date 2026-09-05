'use client'
import { usePreferences } from '@/components/SitePreferences'

export function IntroPanel() {
  const { t } = usePreferences()
  const sections = [
    [t('Business question', 'Pregunta de negocio'), t('Which service requests and agencies create the largest operational bottlenecks, and where should improvement efforts begin?', '¿Qué solicitudes y agencias generan los mayores cuellos de botella operativos y dónde deberían comenzar las mejoras?')],
    [t('Data and coverage', 'Datos y cobertura'), t('NYC Open Data 311 service requests from 2024. Analysis groups request volume, resolution times, service-level compliance and intake channels by agency, borough and complaint type.', 'Solicitudes de servicio 311 de NYC Open Data de 2024. El análisis agrupa volumen, tiempos de resolución, cumplimiento del nivel de servicio y canales de entrada por agencia, municipio y tipo de solicitud.')],
    [t('How to explore', 'Cómo explorar'), t('Executive overview summarizes the current selection. Process flow and Agencies locate delays. Geography and Trends add context. Priorities compares volume and impact. Filters apply to analytical sections.', 'Resumen ejecutivo sintetiza la selección actual. Flujo de procesos y Agencias localizan demoras. Geografía y Tendencias aportan contexto. Prioridades compara volumen e impacto. Los filtros se aplican a las secciones analíticas.')],
    [t('Method and interpretation', 'Método e interpretación'), t('Resolution-time distributions, SLA comparisons and Pareto analysis support prioritization. Differences in agency workloads and request complexity should inform comparisons. Technical process provides the source notebooks and data preparation steps.', 'Las distribuciones de tiempos de resolución, las comparaciones de SLA y el análisis de Pareto apoyan la priorización. Considera las diferencias de carga y complejidad entre agencias al comparar. Proceso técnico presenta los notebooks y la preparación de datos.')],
  ]
  return <div className="grid gap-4 md:grid-cols-2">{sections.map(([title, body]) => <section key={title} className="glass-card p-6"><h2 className="text-lg font-semibold text-ops-text mb-3">{title}</h2><p className="text-sm text-ops-text-muted leading-relaxed">{body}</p></section>)}</div>
}
