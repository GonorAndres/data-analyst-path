'use client'
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

interface SeasonalityChartProps {
  data: {
    days: string[]
    hours: number[]
    matrix: number[][]
  }
  width?: number
  height?: number
}

const DAY_LABELS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export function SeasonalityChart({ data, width: propWidth, height: propHeight }: SeasonalityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return
    if (!data.days.length || !data.hours.length || !data.matrix.length) return

    const w = propWidth || containerRef.current.clientWidth
    const margin = { top: 30, right: 20, bottom: 10, left: 80 }
    const innerW = w - margin.left - margin.right
    const cellW = innerW / data.hours.length
    const cellH = Math.max(18, Math.min(28, 200 / data.days.length))
    const innerH = cellH * data.days.length
    const h = propHeight || innerH + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const tooltip = d3.select(tooltipRef.current)

    const allValues = data.matrix.flat()
    const maxVal = d3.max(allValues) ?? 1

    const color = d3
      .scaleSequential()
      .domain([0, maxVal])
      .interpolator(d3.interpolateRgb('#0F0F0F', '#D4A15E'))

    // Draw cells
    data.days.forEach((day, i) => {
      data.hours.forEach((hour, j) => {
        const val = data.matrix[i]?.[j] ?? 0
        const dayLabel = DAY_LABELS[i] ?? day

        g.append('rect')
          .attr('x', j * cellW)
          .attr('y', i * cellH)
          .attr('width', cellW - 1)
          .attr('height', cellH - 1)
          .attr('fill', color(val))
          .attr('stroke', '#0F0F0F')
          .attr('stroke-width', 0.5)
          .on('mouseenter', function (event: MouseEvent) {
            d3.select(this).attr('stroke', '#EDEBE8').attr('stroke-width', 1)
            tooltip
              .style('display', 'block')
              .style('left', `${event.offsetX + 12}px`)
              .style('top', `${event.offsetY - 28}px`)
              .html(
                `<span style="color:#EDEBE8;font-weight:600">${dayLabel} ${String(hour).padStart(2, '0')}:00</span><br/><span style="color:#D4A15E">${d3.format(',')(val)} solicitudes</span>`
              )
          })
          .on('mousemove', function (event: MouseEvent) {
            tooltip.style('left', `${event.offsetX + 12}px`).style('top', `${event.offsetY - 28}px`)
          })
          .on('mouseleave', function () {
            d3.select(this).attr('stroke', '#0F0F0F').attr('stroke-width', 0.5)
            tooltip.style('display', 'none')
          })
      })
    })

    // Hour labels on top
    g.selectAll('.hour-label')
      .data(data.hours)
      .join('text')
      .attr('x', (_, i) => i * cellW + cellW / 2)
      .attr('y', -6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#7A7670')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px')
      .text((d) => (d % 3 === 0 ? `${d}` : ''))

    // Day labels on left
    g.selectAll('.day-label')
      .data(data.days)
      .join('text')
      .attr('x', -6)
      .attr('y', (_, i) => i * cellH + cellH / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .attr('fill', '#7A7670')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '10px')
      .text((_, i) => DAY_LABELS[i] ?? data.days[i])

    return () => {
      svg.selectAll('*').remove()
    }
  }, [data, propWidth, propHeight])

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
