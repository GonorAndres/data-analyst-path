'use client'
import { useState } from 'react'

const NOTEBOOKS = [
  {
    id: '01',
    file: '01_ingesta_limpieza.html',
    title: '01 -- Ingesta y Limpieza',
    desc: 'Descarga de datos NYC 311 via Socrata API, limpieza de nulos y fechas invalidas, estandarizacion de nombres de agencias y municipios.',
    outputs: 'CSV crudo (~3.5M filas) -> parquet limpio (~3.2M filas)',
  },
  {
    id: '02',
    file: '02_eda_exploratorio.html',
    title: '02 -- Analisis Exploratorio (EDA)',
    desc: 'Distribuciones de tiempos de resolucion, volumen por agencia/municipio, patrones temporales, calidad de datos.',
    outputs: '13 visualizaciones interactivas, hallazgos clave documentados',
  },
  {
    id: '03',
    file: '03_analisis_sla.html',
    title: '03 -- Analisis de Cumplimiento SLA',
    desc: 'Calculo de cumplimiento SLA por agencia, pruebas estadisticas vs promedio ciudad, intervalos de confianza.',
    outputs: 'Tabla de significancia estadistica, modelo logistico',
  },
  {
    id: '04',
    file: '04_mineria_procesos.html',
    title: '04 -- Mineria de Procesos',
    desc: 'Construccion del flujo de procesos (Sankey), deteccion de cuellos de botella, analisis Pareto, recomendaciones.',
    outputs: 'Datos Sankey, ranking de prioridades, resumen ejecutivo',
  },
]

export function ProcesoTecnicoPanel() {
  const [idx, setIdx] = useState(0)
  const current = NOTEBOOKS[idx]
  const hasPrev = idx > 0
  const hasNext = idx < NOTEBOOKS.length - 1

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {NOTEBOOKS.map((nb, i) => (
          <button
            key={nb.id}
            onClick={() => setIdx(i)}
            className={`
              h-1.5 flex-1 transition-colors duration-150 cursor-pointer border-none
              ${i === idx ? 'bg-ops-blue' : i < idx ? 'bg-ops-blue/40' : 'bg-ops-border'}
            `}
            title={nb.title}
          />
        ))}
      </div>

      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans text-sm font-semibold text-ops-text">
            {current.title}
          </h3>
          <p className="font-sans text-xs text-ops-text-muted mt-0.5">
            Notebook {idx + 1} de {NOTEBOOKS.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIdx(idx - 1)}
            disabled={!hasPrev}
            className={`
              font-sans text-xs px-4 py-2 border transition-colors cursor-pointer
              ${hasPrev
                ? 'border-ops-border text-ops-text hover:bg-ops-surface-hover bg-transparent'
                : 'border-ops-border/50 text-ops-text-muted/40 bg-transparent cursor-not-allowed'
              }
            `}
          >
            Anterior
          </button>
          <button
            onClick={() => setIdx(idx + 1)}
            disabled={!hasNext}
            className={`
              font-sans text-xs px-4 py-2 border transition-colors cursor-pointer
              ${hasNext
                ? 'border-ops-blue text-ops-blue hover:bg-ops-blue/10 bg-transparent'
                : 'border-ops-border/50 text-ops-text-muted/40 bg-transparent cursor-not-allowed'
              }
            `}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Description card */}
      <div className="bg-ops-surface border border-ops-border border-l-2 border-l-ops-blue p-4">
        <p className="font-sans text-sm text-ops-text">{current.desc}</p>
        <p className="font-sans text-xs text-ops-text-muted mt-2">
          <span className="text-ops-cyan font-semibold">Salidas:</span> {current.outputs}
        </p>
      </div>

      {/* Notebook iframe */}
      <div className="border border-ops-border">
        <iframe
          key={current.id}
          src={`/notebooks_html/${current.file}`}
          className="w-full border-0"
          style={{ height: '800px', background: '#fff' }}
          title={current.title}
        />
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between border-t border-ops-border pt-4">
        <div>
          {hasPrev && (
            <button
              onClick={() => { setIdx(idx - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="font-sans text-xs text-ops-text-muted hover:text-ops-text bg-transparent border-none cursor-pointer"
            >
              &larr; {NOTEBOOKS[idx - 1].title}
            </button>
          )}
        </div>
        <div>
          {hasNext && (
            <button
              onClick={() => { setIdx(idx + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="font-sans text-xs text-ops-blue hover:text-ops-cyan bg-transparent border-none cursor-pointer"
            >
              {NOTEBOOKS[idx + 1].title} &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
