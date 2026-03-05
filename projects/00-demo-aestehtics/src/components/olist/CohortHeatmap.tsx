'use client'
import { useRef, useState } from 'react'

interface CohortData {
  cohorts: string[]
  months: number[]
  matrix: number[][]
  cohort_sizes: number[]
}

interface Props {
  data: CohortData | undefined
  isLoading: boolean
}

interface TooltipState {
  x: number
  y: number
  cohort: string
  month: number
  retention: number
  visible: boolean
}

export function CohortHeatmap({ data, isLoading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, cohort: '', month: 0, retention: 0, visible: false })

  if (isLoading || !data) {
    return (
      <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 400 }} />
    )
  }

  if (!data.cohorts.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const CELL_W = 52
  const CELL_H = 28
  const LEFT_MARGIN = 90
  const TOP_MARGIN = 48
  const LEGEND_HEIGHT = 40
  const gridWidth = data.months.length * CELL_W - 2
  const svgWidth = LEFT_MARGIN + data.months.length * CELL_W + 20
  const svgHeight = TOP_MARGIN + data.cohorts.length * CELL_H + 20 + LEGEND_HEIGHT
  const legendY = TOP_MARGIN + data.cohorts.length * CELL_H + 20

  function retentionToColor(value: number): string {
    if (value === 0)   return 'var(--heatmap-zero)'
    if (value < 2)    return 'var(--heatmap-low)'
    if (value < 5)    return 'var(--heatmap-low-mid)'
    if (value < 10)   return 'var(--heatmap-mid)'
    if (value < 20)   return 'var(--heatmap-mid-high)'
    return 'var(--heatmap-high)'
  }

  function textColor(value: number): string {
    return value >= 10 ? 'var(--heatmap-zero)' : 'var(--chart-label)'
  }

  const legendTicks = [
    { label: '0%',   offset: 0 },
    { label: '5%',   offset: 0.4 },
    { label: '10%',  offset: 0.6 },
    { label: '≥20%', offset: 1 },
  ]

  return (
    <div ref={containerRef} className="relative overflow-x-auto">
      <svg width={svgWidth} height={svgHeight} style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>
        <defs>
          <linearGradient id="legendGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="var(--heatmap-zero)" />
            <stop offset="20%"  stopColor="var(--heatmap-low)" />
            <stop offset="40%"  stopColor="var(--heatmap-low-mid)" />
            <stop offset="60%"  stopColor="var(--heatmap-mid)" />
            <stop offset="80%"  stopColor="var(--heatmap-mid-high)" />
            <stop offset="100%" stopColor="var(--heatmap-high)" />
          </linearGradient>
        </defs>

        {/* Month headers */}
        {data.months.map((m, mi) => (
          <text
            key={m}
            x={LEFT_MARGIN + mi * CELL_W + CELL_W / 2}
            y={TOP_MARGIN - 8}
            textAnchor="middle"
            fontSize={10}
            fontWeight={m === 0 ? 700 : 400}
            fill={m === 0 ? 'var(--chart-label)' : 'var(--chart-tick)'}
          >
            M{m}
          </text>
        ))}

        {/* Rows */}
        {data.cohorts.map((cohort, ci) => (
          <g key={cohort}>
            {/* Cohort label */}
            <text
              x={LEFT_MARGIN - 8}
              y={TOP_MARGIN + ci * CELL_H + CELL_H / 2 + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--chart-tick)"
            >
              {cohort}
            </text>

            {/* Cells */}
            {data.months.map((m, mi) => {
              const val = data.matrix[ci]?.[mi] ?? 0
              return (
                <g key={m}>
                  <rect
                    x={LEFT_MARGIN + mi * CELL_W}
                    y={TOP_MARGIN + ci * CELL_H}
                    width={CELL_W - 2}
                    height={CELL_H - 2}
                    fill={retentionToColor(val)}
                    rx={2}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect()
                      if (!rect) return
                      setTooltip({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        cohort,
                        month: m,
                        retention: val,
                        visible: true,
                      })
                    }}
                    onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                  />
                  <text
                    x={LEFT_MARGIN + mi * CELL_W + CELL_W / 2 - 1}
                    y={TOP_MARGIN + ci * CELL_H + CELL_H / 2 + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fill={textColor(val)}
                    style={{ pointerEvents: 'none' }}
                  >
                    {val > 0 ? `${val.toFixed(1)}%` : ''}
                  </text>
                </g>
              )
            })}

            {/* Cohort size label */}
            <text
              x={svgWidth - 8}
              y={TOP_MARGIN + ci * CELL_H + CELL_H / 2 + 4}
              textAnchor="end"
              fontSize={9}
              fill="var(--chart-tick)"
            >
              n={data.cohort_sizes[ci]?.toLocaleString() ?? ''}
            </text>
          </g>
        ))}

        {/* Color legend gradient bar */}
        <rect
          x={LEFT_MARGIN}
          y={legendY}
          width={gridWidth}
          height={10}
          fill="url(#legendGradient)"
          rx={2}
        />

        {/* Legend tick labels */}
        {legendTicks.map(({ label, offset }) => (
          <text
            key={label}
            x={LEFT_MARGIN + offset * gridWidth}
            y={legendY + 24}
            textAnchor={offset === 0 ? 'start' : offset === 1 ? 'end' : 'middle'}
            fontSize={9}
            fill="var(--chart-tick)"
          >
            {label}
          </text>
        ))}
      </svg>

      {/* How to read caption */}
      <p className="font-sans text-xs text-muted mt-1">
        Mes 0 = cohorte de adquisición (100%). Los valores posteriores muestran qué % regresó a comprar.
      </p>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none bg-paper dark:bg-[#1A1A1A] border border-border dark:border-[#2a2a2a] px-3 py-2 z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-sans text-xs text-muted">{tooltip.cohort} — Mes {tooltip.month}</p>
          <p className="font-sans text-sm font-medium text-ink dark:text-[#F0EFEB]">{tooltip.retention.toFixed(1)}% retención</p>
        </div>
      )}
    </div>
  )
}
