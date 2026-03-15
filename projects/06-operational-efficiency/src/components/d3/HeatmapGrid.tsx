'use client'
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

interface HeatmapGridProps {
  data: {
    rows: string[]
    cols: string[]
    matrix: number[][]
  }
  colorScale?: string
  width?: number
  height?: number
}

export function HeatmapGrid({ data, width: propWidth, height: propHeight }: HeatmapGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return
    if (!data.rows.length || !data.cols.length || !data.matrix.length) return

    const w = propWidth || containerRef.current.clientWidth
    const margin = { top: 120, right: 20, bottom: 20, left: 140 }
    const cellW = Math.max(20, (w - margin.left - margin.right) / data.cols.length)
    const cellH = Math.max(20, Math.min(32, 300 / data.rows.length))
    const innerW = cellW * data.cols.length
    const innerH = cellH * data.rows.length
    const h = propHeight || innerH + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const tooltip = d3.select(tooltipRef.current)

    // Flatten values for domain
    const allValues = data.matrix.flat()
    const minVal = d3.min(allValues) ?? 0
    const maxVal = d3.max(allValues) ?? 1

    const color = d3
      .scaleSequential()
      .domain([minVal, maxVal])
      .interpolator(d3.interpolateRgb('#171717', '#7EB8DA'))

    // Draw cells
    data.rows.forEach((row, i) => {
      data.cols.forEach((col, j) => {
        const val = data.matrix[i]?.[j] ?? 0

        g.append('rect')
          .attr('x', j * cellW)
          .attr('y', i * cellH)
          .attr('width', cellW - 1)
          .attr('height', cellH - 1)
          .attr('fill', color(val))
          .attr('stroke', '#0F0F0F')
          .attr('stroke-width', 0.5)
          .on('mouseenter', function (event: MouseEvent) {
            d3.select(this).attr('stroke', '#EDEBE8').attr('stroke-width', 1.5)
            tooltip
              .style('display', 'block')
              .style('left', `${event.offsetX + 12}px`)
              .style('top', `${event.offsetY - 28}px`)
              .html(
                `<span style="color:#EDEBE8;font-weight:600">${row}</span> x <span style="color:#7A7670">${col}</span><br/><span style="color:#7EB8DA">${d3.format(',')(val)}</span>`
              )
          })
          .on('mousemove', function (event: MouseEvent) {
            tooltip.style('left', `${event.offsetX + 12}px`).style('top', `${event.offsetY - 28}px`)
          })
          .on('mouseleave', function () {
            d3.select(this).attr('stroke', '#0F0F0F').attr('stroke-width', 0.5)
            tooltip.style('display', 'none')
          })

        // Cell text (only if cells are large enough)
        if (cellW > 35 && cellH > 20) {
          g.append('text')
            .attr('x', j * cellW + cellW / 2)
            .attr('y', i * cellH + cellH / 2)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', val > (maxVal - minVal) / 2 + minVal ? '#0F0F0F' : '#7A7670')
            .attr('font-family', 'JetBrains Mono, monospace')
            .attr('font-size', '9px')
            .text(val >= 1000 ? d3.format('.1s')(val) : d3.format(',')(val))
        }
      })
    })

    // Row labels
    g.selectAll('.row-label')
      .data(data.rows)
      .join('text')
      .attr('x', -6)
      .attr('y', (_, i) => i * cellH + cellH / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .attr('fill', '#7A7670')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '10px')
      .text((d) => (d.length > 18 ? d.slice(0, 16) + '...' : d))

    // Column labels
    g.selectAll('.col-label')
      .data(data.cols)
      .join('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'start')
      .attr('transform', (_, i) => {
        const cx = i * cellW + cellW / 2
        return `translate(${cx}, -6) rotate(-55)`
      })
      .attr('fill', '#7A7670')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '10px')
      .text((d) => (d.length > 20 ? d.slice(0, 18) + '...' : d))

    return () => {
      svg.selectAll('*').remove()
    }
  }, [data, propWidth, propHeight])

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      <svg ref={svgRef} />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none px-3 py-2 text-xs font-sans bg-ops-bg border border-ops-border z-50"
        style={{ display: 'none' }}
      />
    </div>
  )
}
