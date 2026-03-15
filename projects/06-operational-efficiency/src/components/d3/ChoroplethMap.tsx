'use client'
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

interface BoroughData {
  borough: string
  value: number
}

interface ChoroplethMapProps {
  data: BoroughData[]
  metric: string
  onBoroughClick?: (borough: string) => void
}

// Simplified borough outlines as SVG paths (approximate shapes)
// Viewbox coordinates based on a 500x500 canvas
const BOROUGH_PATHS: Record<string, { path: string; labelX: number; labelY: number }> = {
  MANHATTAN: {
    path: 'M200,80 L210,75 L218,90 L222,130 L225,180 L222,230 L218,280 L215,310 L210,340 L205,350 L198,340 L195,310 L193,280 L190,230 L188,180 L190,130 L195,90 Z',
    labelX: 207,
    labelY: 215,
  },
  BROOKLYN: {
    path: 'M215,355 L240,340 L270,330 L310,325 L340,335 L360,355 L370,380 L365,410 L350,430 L320,445 L290,450 L260,445 L235,430 L220,410 L210,385 L212,365 Z',
    labelX: 290,
    labelY: 390,
  },
  QUEENS: {
    path: 'M240,170 L280,155 L320,150 L360,155 L390,170 L410,200 L420,240 L415,280 L400,310 L370,325 L340,330 L310,322 L270,328 L240,338 L228,310 L225,280 L230,240 L235,200 Z',
    labelX: 330,
    labelY: 240,
  },
  BRONX: {
    path: 'M210,72 L230,55 L260,40 L290,35 L320,42 L345,60 L360,85 L365,115 L355,145 L335,160 L310,165 L280,155 L250,160 L230,165 L220,145 L215,115 L212,90 Z',
    labelX: 290,
    labelY: 100,
  },
  'STATEN ISLAND': {
    path: 'M100,340 L130,325 L155,330 L170,350 L175,380 L170,410 L155,435 L130,450 L110,445 L95,425 L85,400 L85,370 L90,350 Z',
    labelX: 130,
    labelY: 390,
  },
}

// Normalize borough name for matching
function normalizeBoroughName(name: string): string {
  const upper = name.toUpperCase().trim()
  if (upper === 'STATEN ISLAND' || upper === 'STATENISLAND') return 'STATEN ISLAND'
  return upper
}

export function ChoroplethMap({ data, metric, onBoroughClick }: ChoroplethMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return
    if (!data || data.length === 0) return

    const w = containerRef.current.clientWidth
    const h = Math.min(w * 0.9, 460)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h).attr('viewBox', '0 0 500 500')

    // Build value map
    const valueMap = new Map<string, number>()
    data.forEach((d) => {
      valueMap.set(normalizeBoroughName(d.borough), d.value)
    })

    const values = Array.from(valueMap.values())
    const minVal = d3.min(values) ?? 0
    const maxVal = d3.max(values) ?? 1

    const colorScale = d3.scaleSequential(
      (t: number) => d3.interpolateRgb('#1A1510', '#D4A15E')(t)
    ).domain([minVal * 0.5, maxVal])

    const tooltip = d3.select(tooltipRef.current)

    // Draw borough shapes
    const boroughs = Object.entries(BOROUGH_PATHS)
    const group = svg.append('g')

    boroughs.forEach(([name, { path, labelX, labelY }]) => {
      const val = valueMap.get(name) ?? 0

      group
        .append('path')
        .attr('d', path)
        .attr('fill', val > 0 ? colorScale(val) : '#212121')
        .attr('stroke', '#2A2A2A')
        .attr('stroke-width', 1.5)
        .attr('cursor', onBoroughClick ? 'pointer' : 'default')
        .on('mouseenter', function (event: MouseEvent) {
          d3.select(this).attr('stroke', '#EDEBE8').attr('stroke-width', 2)
          tooltip
            .style('display', 'block')
            .style('left', `${event.offsetX + 12}px`)
            .style('top', `${event.offsetY - 28}px`)
            .html(
              `<span style="color:#EDEBE8;font-weight:600">${name}</span><br/><span style="color:#7A7670">${metric}: ${d3.format(',')(val)}</span>`
            )
        })
        .on('mousemove', function (event: MouseEvent) {
          tooltip
            .style('left', `${event.offsetX + 12}px`)
            .style('top', `${event.offsetY - 28}px`)
        })
        .on('mouseleave', function () {
          d3.select(this).attr('stroke', '#2A2A2A').attr('stroke-width', 1.5)
          tooltip.style('display', 'none')
        })
        .on('click', function () {
          if (onBoroughClick) onBoroughClick(name)
        })

      // Borough label
      group
        .append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#EDEBE8')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('pointer-events', 'none')
        .text(name === 'STATEN ISLAND' ? 'S.I.' : name.charAt(0) + name.slice(1).toLowerCase())
    })

    return () => {
      svg.selectAll('*').remove()
    }
  }, [data, metric, onBoroughClick])

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
