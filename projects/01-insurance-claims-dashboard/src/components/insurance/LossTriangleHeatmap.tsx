'use client'
import { useRef, useState } from 'react'

interface IBNRRow {
  accident_year: number
  latest_lag: number | null
  latest_value: number | null
  cdf: number
  ultimate: number | null
  ibnr: number | null
}

interface TriangleData {
  accident_years: number[]
  development_lags: number[]
  triangle: (number | null)[][]
  ibnr_by_year: IBNRRow[]
}

type ViewMode = 'incurred' | 'paid'
type ReserveMethod = 'cl' | 'bf'

interface Props {
  data: TriangleData | undefined
  isLoading: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  reserveMethod: ReserveMethod
  onReserveMethodChange: (method: ReserveMethod) => void
}

interface TooltipState {
  x: number
  y: number
  accidentYear: number
  lag: number
  value: number
  visible: boolean
}

export function LossTriangleHeatmap({ data, isLoading, viewMode, onViewModeChange, reserveMethod, onReserveMethodChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, accidentYear: 0, lag: 0, value: 0, visible: false })

  if (isLoading || !data) {
    return (
      <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 400 }} />
    )
  }

  if (!data.accident_years.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const CELL_W = 72
  const CELL_H = 32
  const LEFT_MARGIN = 70
  const TOP_MARGIN = 56
  const IBNR_COL_W = 90
  const LEGEND_HEIGHT = 44
  const gridWidth = data.development_lags.length * CELL_W - 2
  const svgWidth = LEFT_MARGIN + data.development_lags.length * CELL_W + IBNR_COL_W + 20
  const svgHeight = TOP_MARGIN + data.accident_years.length * CELL_H + 20 + LEGEND_HEIGHT
  const legendY = TOP_MARGIN + data.accident_years.length * CELL_H + 20

  // Find max value for color scaling
  const allValues = data.triangle.flat().filter((v): v is number => v != null && v > 0)
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1

  function valueToColor(value: number): string {
    if (value === 0) return 'var(--triangle-zero)'
    const ratio = value / maxVal
    if (ratio < 0.25) return 'var(--triangle-low)'
    if (ratio < 0.6) return 'var(--triangle-mid)'
    return 'var(--triangle-high)'
  }

  function textColor(value: number): string {
    if (value === 0) return 'var(--chart-tick)'
    const ratio = value / maxVal
    return ratio >= 0.6 ? 'var(--triangle-zero)' : 'var(--chart-label)'
  }

  function formatAmount(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
    return v.toFixed(0)
  }

  const legendTicks = [
    { label: '$0', offset: 0 },
    { label: `$${formatAmount(maxVal * 0.25)}`, offset: 0.25 },
    { label: `$${formatAmount(maxVal * 0.6)}`, offset: 0.6 },
    { label: `$${formatAmount(maxVal)}`, offset: 1 },
  ]

  return (
    <div ref={containerRef} className="relative">
      {/* View toggles */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex gap-2">
          {(['incurred', 'paid'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`font-sans text-xs px-3 py-1.5 border transition-colors ${
                viewMode === mode
                  ? 'border-ink dark:border-[#F0EFEB] bg-ink dark:bg-[#F0EFEB] text-[#FAFAF8] dark:text-[#1A1A1A]'
                  : 'border-border dark:border-[#2a2a2a] text-muted hover:border-muted'
              }`}
            >
              {mode === 'incurred' ? 'Incurrido' : 'Pagado'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['cl', 'bf'] as ReserveMethod[]).map(method => (
            <button
              key={method}
              onClick={() => onReserveMethodChange(method)}
              className={`font-sans text-xs px-3 py-1.5 border transition-colors ${
                reserveMethod === method
                  ? 'border-ink dark:border-[#F0EFEB] bg-ink dark:bg-[#F0EFEB] text-[#FAFAF8] dark:text-[#1A1A1A]'
                  : 'border-border dark:border-[#2a2a2a] text-muted hover:border-muted'
              }`}
            >
              {method === 'cl' ? 'Chain-Ladder' : 'Bornhuetter-Ferguson'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>
          <defs>
            <linearGradient id="triangleLegendGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--triangle-zero)" />
              <stop offset="25%" stopColor="var(--triangle-low)" />
              <stop offset="60%" stopColor="var(--triangle-mid)" />
              <stop offset="100%" stopColor="var(--triangle-high)" />
            </linearGradient>
          </defs>

          {/* Column headers: development lags */}
          {data.development_lags.map((lag, li) => (
            <text
              key={lag}
              x={LEFT_MARGIN + li * CELL_W + CELL_W / 2}
              y={TOP_MARGIN - 10}
              textAnchor="middle"
              fontSize={10}
              fontWeight={lag === 1 ? 700 : 400}
              fill={lag === 1 ? 'var(--chart-label)' : 'var(--chart-tick)'}
            >
              Lag {lag}
            </text>
          ))}

          {/* IBNR column header */}
          <text
            x={LEFT_MARGIN + data.development_lags.length * CELL_W + IBNR_COL_W / 2}
            y={TOP_MARGIN - 10}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill="var(--ratio-loss)"
          >
            IBNR
          </text>

          {/* Rows: accident years */}
          {data.accident_years.map((year, ri) => (
            <g key={year}>
              {/* Row label */}
              <text
                x={LEFT_MARGIN - 10}
                y={TOP_MARGIN + ri * CELL_H + CELL_H / 2 + 4}
                textAnchor="end"
                fontSize={10}
                fill="var(--chart-tick)"
              >
                {year}
              </text>

              {/* Data cells */}
              {data.development_lags.map((lag, li) => {
                const val = data.triangle[ri]?.[li] ?? 0
                return (
                  <g key={lag}>
                    <rect
                      x={LEFT_MARGIN + li * CELL_W}
                      y={TOP_MARGIN + ri * CELL_H}
                      width={CELL_W - 2}
                      height={CELL_H - 2}
                      fill={valueToColor(val)}
                      rx={2}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect()
                        if (!rect) return
                        setTooltip({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                          accidentYear: year,
                          lag,
                          value: val,
                          visible: true,
                        })
                      }}
                      onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                    />
                    <text
                      x={LEFT_MARGIN + li * CELL_W + CELL_W / 2 - 1}
                      y={TOP_MARGIN + ri * CELL_H + CELL_H / 2 + 4}
                      textAnchor="middle"
                      fontSize={9}
                      fill={textColor(val)}
                      style={{ pointerEvents: 'none' }}
                    >
                      {val > 0 ? `$${formatAmount(val)}` : ''}
                    </text>
                  </g>
                )
              })}

              {/* IBNR annotation */}
              {data.ibnr_by_year && (() => {
                const ibnrRow = data.ibnr_by_year.find(r => r.accident_year === year)
                return (
                  <text
                    x={LEFT_MARGIN + data.development_lags.length * CELL_W + IBNR_COL_W / 2}
                    y={TOP_MARGIN + ri * CELL_H + CELL_H / 2 + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill="var(--ratio-loss)"
                  >
                    {ibnrRow?.ibnr != null
                      ? `$${formatAmount(ibnrRow.ibnr)}`
                      : '--'}
                  </text>
                )
              })()}
            </g>
          ))}

          {/* Color legend gradient bar */}
          <rect
            x={LEFT_MARGIN}
            y={legendY}
            width={gridWidth}
            height={10}
            fill="url(#triangleLegendGradient)"
            rx={2}
          />

          {/* Legend tick labels */}
          {legendTicks.map(({ label, offset }) => (
            <text
              key={label}
              x={LEFT_MARGIN + offset * gridWidth}
              y={legendY + 26}
              textAnchor={offset === 0 ? 'start' : offset === 1 ? 'end' : 'middle'}
              fontSize={9}
              fill="var(--chart-tick)"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>

      {/* How to read caption */}
      <p className="font-sans text-xs text-muted mt-1">
        Filas = año de accidente. Columnas = lag de desarrollo. Vista: {viewMode === 'incurred' ? 'pérdidas incurridas acumuladas' : 'pérdidas pagadas acumuladas'}.
      </p>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none bg-paper dark:bg-[#1A1A1A] border border-border dark:border-[#2a2a2a] px-3 py-2 z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-sans text-xs text-muted">Año {tooltip.accidentYear} -- Lag {tooltip.lag}</p>
          <p className="font-sans text-sm font-medium text-ink dark:text-[#F0EFEB]">${tooltip.value.toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}
