'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

/**
 * The four notebooks, rendered as exported HTML in an iframe.
 *
 * One at a time, and only on demand. `02_eda_exploratory.html` is 8.5 MB because
 * every Plotly figure carries its own data inline -- loading all four eagerly
 * would pull 12 MB to show one. The iframe is keyed on the selection so switching
 * tabs tears down the previous document instead of leaving four alive.
 *
 * An iframe rather than inlining the HTML: these documents ship their own
 * stylesheets and scripts from nbconvert, and injecting that into the page would
 * let notebook CSS repaint the dashboard around it.
 */
const NOTEBOOKS = [
  {
    id: '01',
    label: '01 — Limpieza',
    title: 'Ingesta y limpieza de datos',
    description:
      'Nueve CSV unidos en dos tablas analíticas. Aquí se resuelve customer_unique_id contra customer_id, la decisión de la que depende todo lo demás.',
    src: '/cohorts/notebooks_html/01_data_ingestion_cleaning.html',
  },
  {
    id: '02',
    label: '02 — Exploración',
    title: 'Análisis exploratorio',
    description:
      'Tendencias macro, distribuciones y patrones geográficos. El notebook más pesado: cada figura de Plotly lleva sus datos incrustados.',
    src: '/cohorts/notebooks_html/02_eda_exploratory.html',
  },
  {
    id: '03',
    label: '03 — Retención',
    title: 'Cohortes y supervivencia',
    description:
      'Matrices de retención, curvas de supervivencia y pruebas estadísticas. Produce las matrices que el tablero publica como JSON.',
    src: '/cohorts/notebooks_html/03_cohort_retention.html',
  },
  {
    id: '04',
    label: '04 — RFM y LTV',
    title: 'Segmentos, LTV y activación',
    description:
      'Puntajes RFM, curvas de valor de vida y la regresión logística de la que salen los odds ratios de activación.',
    src: '/cohorts/notebooks_html/04_rfm_ltv_activation.html',
  },
] as const

export default function NotebooksPage() {
  const [activeId, setActiveId] = useState<string>('01')
  const active = NOTEBOOKS.find((n) => n.id === activeId)!

  return (
    <>
      <PageHeader
        eyebrow="Proceso técnico"
        title="El código detrás de cada cifra"
        lede="Los cuatro notebooks completos, tal como se ejecutaron, con su código y sus salidas. Nada de lo que aparece en los tableros sale de un paso que no esté aquí."
      />

      <div className="flex flex-wrap gap-2">
        {NOTEBOOKS.map((n) => {
          const on = n.id === activeId
          return (
            <button
              key={n.id}
              type="button"
              aria-pressed={on}
              onClick={() => setActiveId(n.id)}
              className={`font-sans text-sm px-3 py-1.5 rounded-sm border transition-colors ${
                on
                  ? 'border-[var(--series-1)] text-[var(--chart-label)]'
                  : 'border-border dark:border-[#2a2a2a] text-muted hover:text-[var(--chart-label)]'
              }`}
            >
              {n.label}
            </button>
          )
        })}
      </div>

      <figure className="border border-border dark:border-[#2a2a2a] bg-[var(--chart-bg)] rounded-sm">
        <figcaption className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          <div>
            <h2 className="font-serif text-lg leading-snug text-[var(--chart-label)]">
              {active.title}
            </h2>
            <p className="font-sans text-sm text-muted mt-0.5 max-w-2xl">{active.description}</p>
          </div>
          <a
            href={active.src}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-sans px-2.5 py-1.5
                       border border-border dark:border-[#2a2a2a] rounded-sm text-muted
                       hover:text-[var(--chart-label)] transition-colors"
          >
            <ExternalLink size={14} aria-hidden />
            Abrir aparte
          </a>
        </figcaption>

        <div className="px-2 pb-2">
          <iframe
            // Keyed on the notebook so switching unloads the previous document
            // rather than keeping several megabytes of it alive in the page.
            key={active.id}
            src={active.src}
            title={active.title}
            loading="lazy"
            className="w-full h-[75vh] bg-white rounded-sm"
          />
        </div>
      </figure>

      <p className="font-sans text-xs text-muted">
        Los notebooks se exportan con <code>jupyter nbconvert --to html</code> y se publican tal
        cual. Traen su propio CSS, por lo que se muestran sobre fondo blanco en ambos temas: es el
        documento original, no una versión reestilizada para el tablero.
      </p>
    </>
  )
}
