'use client'
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useOpsPareto } from '@/hooks/useOpsAPI'
import { useOpsFilters } from '@/context/OpsFilterContext'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { ParetoChart } from '@/components/d3/ParetoChart'

interface PriorityItem {
  complaint_type: string
  volume: number
  avg_resolution_days: number
  sla_compliance: number
}

function PriorityScatter({ data }: { data: PriorityItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.length === 0) return

    const w = containerRef.current.clientWidth
    const h = 320
    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const innerW = w - margin.left - margin.right
    const innerH = h - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const tooltip = d3.select(tooltipRef.current)

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.volume) ?? 1])
      .nice()
      .range([0, innerW])

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.avg_resolution_days) ?? 1])
      .nice()
      .range([innerH, 0])

    function slaColor(sla: number) {
      if (sla >= 85) return '#6FCF97'
      if (sla >= 70) return '#F2C94C'
      return '#EB5757'
    }

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => d3.format('.2s')(d as number)))
      .selectAll('text')
      .attr('fill', '#7A7670')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px')

    g.selectAll('.domain, line').attr('stroke', '#2A2A2A')

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', '#7A7670')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px')

    // Axis labels
    svg
      .append('text')
      .attr('x', margin.left + innerW / 2)
      .attr('y', h - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#7A7670')
      .attr('font-family', 'Inter')
      .attr('font-size', '10px')
      .text('Volumen de solicitudes')

    svg
      .append('text')
      .attr('transform', `rotate(-90)`)
      .attr('x', -(margin.top + innerH / 2))
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#7A7670')
      .attr('font-family', 'Inter')
      .attr('font-size', '10px')
      .text('Dias de resolucion prom.')

    // Dots
    g.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.volume))
      .attr('cy', (d) => y(d.avg_resolution_days))
      .attr('r', 5)
      .attr('fill', (d) => slaColor(d.sla_compliance))
      .attr('opacity', 0.8)
      .on('mouseenter', function (event: MouseEvent, d) {
        d3.select(this).attr('r', 8).attr('opacity', 1)
        tooltip
          .style('display', 'block')
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`)
          .html(
            `<span style="color:#EDEBE8;font-weight:600">${d.complaint_type}</span><br/><span style="color:#7A7670">Solicitudes: ${d3.format(',')(d.volume)}</span><br/><span style="color:#7A7670">Resolucion: ${(d.avg_resolution_days ?? 0).toFixed(1)}d</span><br/><span style="color:${slaColor(d.sla_compliance ?? 0)}">SLA: ${d.sla_compliance != null ? d.sla_compliance.toFixed(1) + '%' : 'N/A'}</span>`
          )
      })
      .on('mousemove', function (event: MouseEvent) {
        tooltip.style('left', `${event.offsetX + 12}px`).style('top', `${event.offsetY - 28}px`)
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', 5).attr('opacity', 0.8)
        tooltip.style('display', 'none')
      })

    // Legend
    const legendData = [
      { label: 'SLA >= 85%', color: '#6FCF97' },
      { label: 'SLA >= 70%', color: '#F2C94C' },
      { label: 'SLA < 70%', color: '#EB5757' },
    ]

    const legend = svg.append('g').attr('transform', `translate(${w - margin.right - 120}, ${margin.top})`)
    legendData.forEach((d, i) => {
      legend.append('circle').attr('cx', 0).attr('cy', i * 16).attr('r', 4).attr('fill', d.color)
      legend
        .append('text')
        .attr('x', 10)
        .attr('y', i * 16 + 4)
        .attr('fill', '#7A7670')
        .attr('font-family', 'Inter')
        .attr('font-size', '9px')
        .text(d.label)
    })

    return () => {
      svg.selectAll('*').remove()
    }
  }, [data])

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} className="w-full" />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none px-3 py-2 text-xs font-sans bg-ops-bg border border-ops-border z-50"
        style={{ display: 'none' }}
      />
    </div>
  )
}

export function ParetoPanel() {
  const { queryString } = useOpsFilters()
  const { data, error, isLoading } = useOpsPareto(queryString)

  if (error) {
    return (
      <div className="border border-ops-red/50 bg-ops-red/5 p-6">
        <p className="font-sans text-sm text-ops-red">Error al cargar datos de Pareto.</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-ops-surface animate-pulse border border-ops-border" />
        <div className="h-48 bg-ops-surface animate-pulse border border-ops-border" />
      </div>
    )
  }

  const paretoItems = (data.pareto?.items ?? []).map(
    (item: { complaint_type?: string; label?: string; count: number; pct: number; cumulative_pct: number }) => ({
      ...item,
      label: item.label ?? item.complaint_type ?? '',
    })
  )
  const priorityMatrix: PriorityItem[] = data.priority_matrix ?? []

  // Calculate insight: how many types make up 80%
  const under80 = paretoItems.filter(
    (item: { cumulative_pct: number }) => item.cumulative_pct <= 80
  )
  const totalTypes = paretoItems.length
  const pctTypes =
    totalTypes > 0 ? ((under80.length / totalTypes) * 100).toFixed(0) : '0'

  return (
    <div className="space-y-4">
      <ChartContainer
        title="Analisis de Pareto"
        subtitle="Tipos de queja por volumen y acumulado"
      >
        {paretoItems.length > 0 ? (
          <>
            <ParetoChart data={paretoItems} />
            <div className="mt-3 px-1">
              <p className="font-sans text-xs text-ops-text-muted">
                <span className="text-ops-amber font-semibold">Regla 80/20:</span> El{' '}
                {pctTypes}% de tipos de queja genera el 80% del volumen total.
              </p>
            </div>
          </>
        ) : (
          <p className="text-ops-text-muted text-sm font-sans py-8 text-center">
            Sin datos de Pareto.
          </p>
        )}
      </ChartContainer>

      {priorityMatrix.length > 0 && (
        <ChartContainer
          title="Matriz de Prioridades"
          subtitle="Volumen vs. tiempo de resolucion, color por SLA"
        >
          <PriorityScatter data={priorityMatrix} />
        </ChartContainer>
      )}
    </div>
  )
}
