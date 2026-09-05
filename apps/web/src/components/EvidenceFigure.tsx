'use client'

import { useId, useState } from 'react'
import { usePreferences } from './SitePreferences'
import evidence from '@/lib/evidence-snapshots.json'
import type { CaseStudy } from '@/lib/case-studies'

/** Figures explain a relationship; measured snapshots and examples are identified separately. */
export function EvidenceFigure({ kind, compact = false }: { kind: CaseStudy['figure']; compact?: boolean }) {
  const { t, locale } = usePreferences()
  const id = useId()
  const [year, setYear] = useState(1997)
  const [experiment, setExperiment] = useState<'uncertain' | 'positive'>('uncertain')
  const [risk, setRisk] = useState(1)
  const number = (value: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
  const labels: Record<CaseStudy['figure'], string> = {
    development: t('Claims payments made and estimated payments remaining', 'Pagos de siniestros realizados y pendientes estimados'),
    cohort: t('How many customers bought again?', '¿Cuántos clientes volvieron a comprar?'),
    experiment: t('Estimated change in conversion and its uncertainty', 'Cambio estimado en la conversión y su incertidumbre'),
    revenue: t('What changed monthly recurring revenue?', '¿Qué cambió los ingresos recurrentes del mes?'),
    risk: t('Two investments with the same final value and different losses along the way', 'Dos inversiones con el mismo valor final y distintas caídas'),
    flow: t('How a service request is recorded and its resolution time calculated', 'Cómo se registra una solicitud y se calcula su tiempo de atención'),
    distribution: t('Listings are concentrated in a few boroughs', 'Los anuncios se concentran en pocas alcaldías'),
  }
  const measured = ['development', 'cohort', 'distribution', 'revenue'].includes(kind)
  return <figure className={`evidence-figure ${compact ? 'figure-compact' : ''}`} aria-labelledby={id}>
    <div className="figure-heading"><span className="figure-index">{t('FIG.', 'FIG.')} 01</span><span className="evidence-tag">{measured ? t('Retained evidence', 'Evidencia conservada') : t('Illustrative example', 'Ejemplo ilustrativo')}</span></div>
    <h3 id={id}>{labels[kind]}</h3>
    {kind === 'development' && (() => {
      const row = evidence.insurance.rows.find(item => item.year === year)!
      return <>
        <div className="development-layout">
          <div className="development-matrix" aria-label={t('Observed development periods by accident year', 'Periodos observados por año de accidente')}>
            <div className="matrix-axis"><span>{t('Year', 'Año')}</span><span>1</span><span>5</span><span>10</span></div>
            {evidence.insurance.rows.map(item => <div className={`matrix-row ${item.year === year ? 'matrix-selected' : ''}`} key={item.year}>
              <span>{item.year}</span><div>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < item.periods ? 'observed-cell' : 'unobserved-cell'} />)}</div>
            </div>)}
            <p className="axis-caption">{t('Development period →', 'Periodo de desarrollo →')}</p>
          </div>
          <div className="figure-callout"><span className="figure-big-number">{number(row.paidPercent, 1)}<small>%</small></span><p>{t('of projected ultimate losses already paid', 'de las pérdidas finales proyectadas ya pagadas')}</p><span className="figure-small-note">{year} · {row.periods} {t('observed periods', 'periodos observados')}</span></div>
        </div>
        {!compact && <label className="figure-control">{t('Follow an accident year', 'Seguir un año de accidente')}<select value={year} onChange={event => setYear(Number(event.target.value))}>{evidence.insurance.rows.map(row => <option key={row.year} value={row.year}>{row.year}</option>)}</select></label>}
        <div className="loss-bar" role="img" aria-label={`${number(row.paidPercent, 1)}% ${t('paid', 'pagado')}`}><span style={{ width: `${row.paidPercent}%` }} /><span style={{ width: `${100 - row.paidPercent}%` }} /></div>
        <div className="figure-legend"><span><i />{t('Paid', 'Pagado')} · {number(row.paidPercent, 1)}%</span><span><i />{t('Projected unpaid', 'Pendiente proyectado')} · {number(100 - row.paidPercent, 1)}%</span></div>
        <figcaption>{t('Paid Chain-Ladder · all API companies and lines · 1988–1997. Newer years have less observed development. Projected unpaid losses include case reserves and IBNR; this is not an uncertainty interval.', 'Chain-Ladder pagado · todas las compañías y líneas de la API · 1988–1997. Los años recientes tienen menos desarrollo observado. Lo pendiente proyectado incluye reservas de caso e IBNR; no es un intervalo de incertidumbre.')} <a href={evidence.insurance.source}>{t('API snapshot', 'Captura de la API')}</a> · {evidence.insurance.capturedAt}.</figcaption>
      </>
    })()}
    {kind === 'cohort' && <>
      <div className="cohort-stat"><span className="figure-big-number">{number(evidence.ecommerce.repeatRate, 1)}<small>%</small></span><p>{t('of customers placed at least two orders in the retained observation window.', 'de los clientes hicieron al menos dos pedidos dentro del periodo observado.')}</p></div>
      <div className="customer-dots" role="img" aria-label={t('About 3 in every 100 customers ordered again', 'Aproximadamente 3 de cada 100 clientes volvieron a comprar')}>{Array.from({ length: 100 }, (_, i) => <i key={i} className={i < 3 ? 'repeat-customer' : ''} />)}</div>
      <div className="figure-legend"><span><i />{number(evidence.ecommerce.repeatCustomers)} {t('repeat customers', 'clientes que recompraron')}</span><span>{number(evidence.ecommerce.customers)} {t('customers total', 'clientes en total')}</span></div>
      {!compact && <div className="cohort-months"><h4>{t('Now follow one cohort: January 2018', 'Ahora sigue una cohorte: enero de 2018')}</h4><p>{number(evidence.ecommerce.cohortSize)} {t('first-time customers. Share purchasing in each later month:', 'clientes nuevos. Proporción que compra en cada mes posterior:')}</p><div>{evidence.ecommerce.returning.map((value, i) => <div key={i}><span>M{i + 1}</span><strong>{number(value / evidence.ecommerce.cohortSize * 100, 2)}%</strong></div>)}</div><p>{t('Monthly activity is not the cumulative repeat-purchase rate. A customer can appear in more than one month.', 'La actividad mensual no es la tasa acumulada de recompra. Un cliente puede aparecer en varios meses.')}</p></div>}
      <figcaption>{t('Olist customer-retention artifacts', 'Archivos de retención de Olist')} · {evidence.ecommerce.coverage.join(' – ')} · <a href="/cohorts/data/overview.json">{t('Source counts', 'Conteos de origen')}</a>. {t('This population is separate from the marketplace aggregation.', 'Esta población es distinta de la agregación del marketplace.')}</figcaption>
    </>}
    {kind === 'experiment' && <>
      <svg viewBox="0 0 600 230" role="img" aria-label={t('Hypothetical confidence interval compared with zero lift', 'Intervalo de confianza hipotético comparado con un efecto nulo')}>
        <line x1="300" y1="25" x2="300" y2="170" className="figure-zero" />
        <text x="300" y="205" textAnchor="middle">{t('No effect', 'Sin efecto')}</text>
        <text x="75" y="205">−3 pp</text><text x="525" y="205" textAnchor="end">+3 pp</text>
        <line x1="75" x2="525" y1="170" y2="170" className="figure-axis" />
        <line x1={experiment === 'uncertain' ? 203 : 345} x2={experiment === 'uncertain' ? 458 : 495} y1="95" y2="95" className="interval-line" />
        <circle cx={experiment === 'uncertain' ? 330 : 420} cy="95" r="9" className="figure-point" />
        <text x="300" y="145" textAnchor="middle">{experiment === 'uncertain' ? t('Both improvement and harm remain plausible', 'Mejora y daño siguen siendo plausibles') : t('The interval is above zero', 'El intervalo está por encima de cero')}</text>
      </svg>
      {!compact && <div className="figure-options" aria-label={t('Hypothetical experiment', 'Experimento hipotético')}><button aria-pressed={experiment === 'uncertain'} onClick={() => setExperiment('uncertain')}>{t('Crosses zero', 'Cruza el cero')}</button><button aria-pressed={experiment === 'positive'} onClick={() => setExperiment('positive')}>{t('Above zero', 'Sobre el cero')}</button></div>}
      <figcaption>{t('Constructed examples: point estimates of +0.4 and +1.6 percentage points, with illustrative 95% intervals [−1.3, +2.1] and [+0.6, +2.6]. These are not results from the experiment. Practical benefit, guardrails, and experiment quality still matter.', 'Ejemplos construidos: estimaciones de +0,4 y +1,6 puntos porcentuales, con intervalos ilustrativos del 95% [−1,3; +2,1] y [+0,6; +2,6]. No son resultados del experimento. También importan el beneficio práctico, las métricas de control y la calidad del experimento.')}</figcaption>
    </>}
    {kind === 'revenue' && <>
      <div className="revenue-bridge">{[
        [number(evidence.kpi.bridge.starting_mrr / 1000, 1), t('Opening MRR', 'MRR inicial'), 'total'],
        ['+' + number(evidence.kpi.bridge.new / 1000, 1), t('New', 'Nuevo'), 'up'],
        ['+' + number(evidence.kpi.bridge.expansion / 1000, 1), t('Expansion', 'Expansión'), 'up'],
        ['−' + number(evidence.kpi.bridge.contraction / 1000, 1), t('Contraction', 'Contracción'), 'down'],
        ['−' + number(evidence.kpi.bridge.churned / 1000, 1), t('Churn', 'Cancelación'), 'down'],
        [number(evidence.kpi.bridge.ending_mrr / 1000, 1), t('Closing MRR', 'MRR final'), 'total'],
      ].map(([value, label, direction]) => <div key={label} className={`bridge-${direction}`}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <div className="figure-equation">{t('USD thousands · December 2025 · net movement', 'Miles de USD · diciembre de 2025 · cambio neto')}: +{number((evidence.kpi.bridge.ending_mrr - evidence.kpi.bridge.starting_mrr) / 1000, 1)}</div>
      <figcaption>{t('NovaCRM synthetic scenario, seed 42. This bridge uses the same figures as the December report; displayed components are rounded. Growth is a net movement: expansion can conceal contraction and churn. It does not establish a cause.', 'Escenario sintético NovaCRM, semilla 42. Este puente usa las mismas cifras del informe de diciembre; los componentes visibles están redondeados. El crecimiento es un cambio neto: la expansión puede ocultar contracción y cancelaciones. No establece una causa.')} <a href="/kpi/evidence/revenue-bridge.json">{t('Source bridge', 'Puente de origen')}</a> · {evidence.kpi.reviewedAt}.</figcaption>
    </>}
    {kind === 'risk' && <>
      <svg viewBox="0 0 600 250" role="img" aria-label={t('Two hypothetical investment paths with the same endpoint and different drawdowns', 'Dos trayectorias hipotéticas con el mismo punto final y distintas caídas')}>
        <line x1="45" x2="555" y1="205" y2="205" className="figure-axis" />
        <path d="M45 170 L115 155 L185 140 L255 145 L325 115 L395 90 L465 80 L555 55" className="risk-path" />
        <path d={risk === 1 ? 'M45 170 L115 100 L185 55 L255 180 L325 165 L395 120 L465 95 L555 55' : 'M45 170 L115 135 L185 110 L255 150 L325 140 L395 95 L465 75 L555 55'} className="risk-path risk-volatile" />
        <circle cx="555" cy="55" r="6" className="figure-point" />
        <text x="550" y="35" textAnchor="end">{t('Same final value', 'Mismo valor final')}</text>
        <text x="45" y="235">{t('Start', 'Inicio')}</text><text x="555" y="235" textAnchor="end">{t('Time →', 'Tiempo →')}</text>
      </svg>
      {!compact && <div className="figure-options"><button aria-pressed={risk === 1} onClick={() => setRisk(1)}>{t('Deeper drawdown', 'Mayor caída')}</button><button aria-pressed={risk === 0} onClick={() => setRisk(0)}>{t('Shallower drawdown', 'Menor caída')}</button></div>}
      <figcaption>{t('Conceptual paths, not historical returns or a forecast. Equal final returns can conceal very different peak-to-trough losses. Compare drawdown, volatility, and concentration before interpreting simulated future outcomes.', 'Trayectorias conceptuales, no rendimientos históricos ni pronósticos. Un mismo rendimiento final puede ocultar pérdidas muy distintas desde el máximo. Compara caída máxima, volatilidad y concentración antes de interpretar escenarios simulados.')}</figcaption>
    </>}
    {kind === 'flow' && <>
      <ol className="request-flow">{[
        [t('Request received', 'Solicitud recibida'), t('Created date', 'Fecha de creación')],
        [t('Agency assigned', 'Agencia asignada'), t('Compare workload', 'Comparar carga')],
        [t('Open or closed', 'Abierta o cerrada'), t('Status at extraction', 'Estado al extraer')],
      ].map(([title, subtitle], i) => <li key={title}><span>0{i + 1}</span><strong>{title}</strong><small>{subtitle}</small></li>)}</ol>
      <div className="figure-equation">{t('Resolution time = closed date − created date', 'Tiempo de resolución = cierre − creación')}</div>
      <figcaption>{t('Reading guide, not measured stage durations. The 311 snapshot contains current statuses, not a complete event log. SLA comparisons need both a closure date and a due date; unresolved requests must remain visible separately.', 'Guía de lectura, no duraciones medidas por etapa. La captura de 311 contiene estados actuales, no un registro completo de eventos. Comparar cumplimiento requiere fecha de cierre y vencimiento; las solicitudes abiertas deben mostrarse por separado.')}</figcaption>
    </>}
    {kind === 'distribution' && <>
      <div className="area-bars">{evidence.airbnb.areas.map(area => <div key={area.name}><div><span>{area.name}</span><strong>{number(area.listings)}</strong></div><div className="area-track"><span style={{ width: `${area.listings / evidence.airbnb.areas[0].listings * 100}%` }} /></div></div>)}</div>
      <p className="figure-small-note">{t('Listings · five largest borough counts in the retained artifact', 'Anuncios · cinco alcaldías con mayor conteo en el archivo')}</p>
      <figcaption><a href="/data/airbnb/neighborhood_ranking.json">{t('Inside Airbnb-derived borough counts', 'Conteos por alcaldía derivados de Inside Airbnb')}</a>. {t('Artifact updated', 'Archivo actualizado')}: {evidence.airbnb.artifactUpdated}. {t('This timestamp is not a verified collection date. Listing supply does not measure bookings, occupancy, or host income.', 'Esta fecha no es una fecha de recolección verificada. La oferta de anuncios no mide reservas, ocupación ni ingresos.')}</figcaption>
    </>}
  </figure>
}
