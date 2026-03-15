'use client'
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

interface ParetoItem {
  label: string
  count: number
  pct: number
  cumulative_pct: number
}

interface ParetoChartProps {
  data: ParetoItem[]
  width?: number
  height?: number
}

export function ParetoChart({ data, width: propWidth, height: propHeight }: ParetoChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.length === 0) return

    const w = propWidth || containerRef.current.clientWidth
    const h = propHeight || 400
    const margin = { top: 20, right: 55, bottom: 100, left: 60 }
    const innerW = w - margin.left - margin.right
    const innerH = h - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const tooltip = d3.select(tooltipRef.current)

    // Scales
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.25)

    const yLeft = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) ?? 1])
      .nice()
      .range([innerH, 0])

    const yRight = d3.scaleLinear().domain([0, 100]).range([innerH, 0])

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .attr('fill', '#7A7670')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '10px')
      .text(function () {
        const t = d3.select(this).text()
        return t.length > 18 ? t.slice(0, 16) + '...' : t
      })

    g.selectAll('.domain, line').attr('stroke', '#2A2A2A')

    // Left Y axis (count)
    g.append('g')
      .call(
        d3
          .axisLeft(yLeft)
          .ticks(5)
          .tickFormat((d) => d3.format('.2s')(d as number))
      )
      .selectAll('text')
      .attr('fill', '#7A7670')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px')

    g.selectAll('.domain, line').attr('stroke', '#2A2A2A')

    // Right Y axis (cumulative %)
    g.append('g')
      .attr('transform', `translate(${innerW},0)`)
      .call(
        d3
          .axisRight(yRight)
          .ticks(5)
          .tickFormat((d) => `${d}%`)
      )
      .selectAll('text')
      .attr('fill', '#7EB8DA')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px')

    // 80% reference line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', yRight(80))
      .attr('y2', yRight(80))
      .attr('stroke', '#F2C94C')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0.7)

    g.append('text')
      .attr('x', innerW - 4)
      .attr('y', yRight(80) - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#F2C94C')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px')
      .text('80%')

    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.label) ?? 0)
      .attr('y', (d) => yLeft(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerH - yLeft(d.count))
      .attr('fill', (d) => (d.cumulative_pct <= 80 ? '#D4A15E' : '#6B4E2A'))
      .on('mouseenter', function (event: MouseEvent, d) {
        d3.select(this).attr('fill', '#E8C97A')
        tooltip
          .style('display', 'block')
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`)
          .html(
            `<span style="color:#EDEBE8;font-weight:600">${d.label}</span><br/><span style="color:#7A7670">Cantidad: ${d3.format(',')(d.count)}</span><br/><span style="color:#7EB8DA">Acumulado: ${d.cumulative_pct.toFixed(1)}%</span>`
          )
      })
      .on('mousemove', function (event: MouseEvent) {
        tooltip.style('left', `${event.offsetX + 12}px`).style('top', `${event.offsetY - 28}px`)
      })
      .on('mouseleave', function (_, d) {
        d3.select(this).attr('fill', d.cumulative_pct <= 80 ? '#D4A15E' : '#6B4E2A')
        tooltip.style('display', 'none')
      })

    // Cumulative line
    const line = d3
      .line<ParetoItem>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y((d) => yRight(d.cumulative_pct))

    g.append('path')
      .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#7EB8DA')
      .attr('stroke-width', 2)

    // Cumulative dots
    g.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('cx', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .attr('cy', (d) => yRight(d.cumulative_pct))
      .attr('r', 3)
      .attr('fill', '#7EB8DA')

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
