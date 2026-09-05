'use client'
import { FeatureText, translateFeature } from '@/features/portfolio/FeatureText'
import { useRef, useEffect, useState } from 'react'
import { usePreferences } from '@/components/SitePreferences'
import * as d3 from 'd3'
import { useOpsTrends } from '@/features/operations/hooks/useOpsAPI'
import { useOpsFilters } from '@/features/operations/context/OpsFilterContext'
import { ChartContainer } from '@/features/operations/components/ui/ChartContainer'
import { SeasonalityChart } from '@/features/operations/components/d3/SeasonalityChart'

interface MonthlyPoint {
  month: string
  total_requests: number
  avg_resolution_days: number
}

function MonthlyLineChart({ data }: { data: MonthlyPoint[] }) {
  const { theme, locale } = usePreferences()
  const [chartWidth, setChartWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => setChartWidth(entries[0].contentRect.width))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.length === 0) return

    const w = containerRef.current.clientWidth
    const h = 280
    const margin = { top: 20, right: 55, bottom: 40, left: 55 }
    const innerW = w - margin.left - margin.right
    const innerH = h - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const tooltip = d3.select(tooltipRef.current)

    const x = d3
      .scalePoint<string>()
      .domain(data.map((d) => d.month))
      .range([0, innerW])

    const yLeft = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.total_requests) ?? 1])
      .nice()
      .range([innerH, 0])

    const yRight = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.avg_resolution_days) ?? 1])
      .nice()
      .range([innerH, 0])

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .attr('fill', 'var(--ops-text-muted)')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')

    g.selectAll('.domain').attr('stroke', 'var(--ops-border)')

    g.append('g')
      .call(
        d3.axisLeft(yLeft).ticks(5).tickFormat((d) => d3.format('.2s')(d as number))
      )
      .selectAll('text')
      .attr('fill', 'var(--ops-blue)')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px')

    g.append('g')
      .attr('transform', `translate(${innerW},0)`)
      .call(
        d3.axisRight(yRight).ticks(5).tickFormat((d) => `${d}d`)
      )
      .selectAll('text')
      .attr('fill', 'var(--ops-amber)')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px')

    // Requests line
    const lineReq = d3
      .line<MonthlyPoint>()
      .x((d) => x(d.month) ?? 0)
      .y((d) => yLeft(d.total_requests))

    g.append('path')
      .datum(data)
      .attr('d', lineReq)
      .attr('fill', 'none')
      .attr('stroke', 'var(--ops-blue)')
      .attr('stroke-width', 2)

    // Resolution line
    const lineRes = d3
      .line<MonthlyPoint>()
      .x((d) => x(d.month) ?? 0)
      .y((d) => yRight(d.avg_resolution_days))

    g.append('path')
      .datum(data)
      .attr('d', lineRes)
      .attr('fill', 'none')
      .attr('stroke', 'var(--ops-amber)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,3')

    // Dots with tooltip
    g.selectAll('.dot-req')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.month) ?? 0)
      .attr('cy', (d) => yLeft(d.total_requests))
      .attr('r', 3)
      .attr('fill', 'var(--ops-blue)')
      .on('mouseenter', function (event: MouseEvent, d) {
        tooltip
          .style('display', 'block')
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`)
          .html(
            `<span style="color:var(--ops-text);font-weight:600">${d.month}</span><br/><span style="color:var(--ops-blue)">${translateFeature('Solicitudes', locale)}: ${d3.format(',')(d.total_requests)}</span><br/><span style="color:var(--ops-amber)">${translateFeature('Resolucion Prom.', locale)}: ${d.avg_resolution_days == null ? '—' : d.avg_resolution_days.toFixed(1)}d</span>`
          )
      })
      .on('mousemove', function (event: MouseEvent) {
        tooltip.style('left', `${event.offsetX + 12}px`).style('top', `${event.offsetY - 28}px`)
      })
      .on('mouseleave', function () {
        tooltip.style('display', 'none')
      })

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${margin.left + 10}, 12)`)
    legend.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 0).attr('y2', 0).attr('stroke', 'var(--ops-blue)').attr('stroke-width', 2)
    legend.append('text').attr('x', 20).attr('y', 4).attr('fill', 'var(--ops-text-muted)').attr('font-size', '10px').attr('font-family', 'Inter').text(translateFeature('Solicitudes', locale))
    legend.append('line').attr('x1', 110).attr('x2', 126).attr('y1', 0).attr('y2', 0).attr('stroke', 'var(--ops-amber)').attr('stroke-width', 2).attr('stroke-dasharray', '4,3')
    legend.append('text').attr('x', 130).attr('y', 4).attr('fill', 'var(--ops-text-muted)').attr('font-size', '10px').attr('font-family', 'Inter').text(translateFeature('Dias resolucion', locale))

    return () => {
      svg.selectAll('*').remove()
    }
  }, [data, theme, locale, chartWidth])

  return (
    <FeatureText><div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} className="w-full" />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none px-3 py-2 text-xs font-sans bg-ops-bg border border-ops-border z-50"
        style={{ display: 'none' }}
      />
    </div></FeatureText>
  )
}

export function TrendsPanel() {
  const { queryString } = useOpsFilters()
  const { data, error, isLoading } = useOpsTrends(queryString)

  if (error) {
    return (
      <FeatureText><div className="border border-ops-red/50 bg-ops-red/5 p-6">
        <p className="font-sans text-sm text-ops-red">Error al cargar datos de tendencias.</p>
      </div></FeatureText>
    )
  }

  if (isLoading) {
    return (
      <FeatureText><div className="space-y-4">
        <div className="h-64 bg-ops-surface animate-pulse border border-ops-border" />
        <div className="h-48 bg-ops-surface animate-pulse border border-ops-border" />
      </div></FeatureText>
    )
  }

  if (!data) return <FeatureText><p className="text-sm text-muted py-8">No data available.</p></FeatureText>

  const monthly: MonthlyPoint[] = data.monthly ?? []
  const seasonality = data.dow_hour ?? { days: [], hours: [], matrix: [] }

  // Find peak month
  const peakMonth = monthly.reduce(
    (max, d) => (d.total_requests > max.total_requests ? d : max),
    monthly[0] ?? { month: 'N/A', total_requests: 0, avg_resolution_days: 0 }
  )

  return (
    <FeatureText><div className="space-y-4">
      <ChartContainer
        title="Tendencia Mensual"
        subtitle="Volumen de solicitudes y tiempo de resolucion promedio"
      >
        {monthly.length > 0 ? (
          <>
            <MonthlyLineChart data={monthly} />
            <div className="mt-3 px-1">
              <p className="font-sans text-xs text-ops-text-muted">
                <span className="text-ops-cyan font-semibold">Pico de solicitudes:</span>{' '}
                {peakMonth.month} con {peakMonth.total_requests.toLocaleString('es-MX')} solicitudes
              </p>
            </div>
          </>
        ) : (
          <p className="text-ops-text-muted text-sm font-sans py-8 text-center">
            Sin datos mensuales.
          </p>
        )}
      </ChartContainer>

      {seasonality.days.length > 0 && (
        <ChartContainer
          title="Estacionalidad"
          subtitle="Mapa de calor: dia de la semana x hora del dia"
        >
          <SeasonalityChart data={seasonality} />
        </ChartContainer>
      )}
    </div></FeatureText>
  )
}
