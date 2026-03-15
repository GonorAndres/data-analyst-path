'use client'
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

interface GaugeChartProps {
  value: number
  max?: number
  label: string
  thresholds?: { good: number; warn: number }
  size?: number
}

export function GaugeChart({
  value,
  max = 100,
  label,
  thresholds = { good: 85, warn: 70 },
  size: propSize,
}: GaugeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const size = propSize || Math.min(containerRef.current.clientWidth, 220)
    const w = size
    const h = size * 0.65

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h)

    const cx = w / 2
    const cy = h - 16
    const outerR = Math.min(cx, cy) - 8
    const innerR = outerR * 0.72
    const startAngle = -Math.PI / 2
    const endAngle = Math.PI / 2

    const pct = Math.min(value / max, 1)
    const fillAngle = startAngle + pct * (endAngle - startAngle)

    // Determine fill color
    const pctVal = (value / max) * 100
    let fillColor = '#EB5757' // red
    if (pctVal >= thresholds.good) fillColor = '#6FCF97' // green
    else if (pctVal >= thresholds.warn) fillColor = '#F2C94C' // amber

    const arcBg = d3
      .arc<any>()
      .innerRadius(innerR)
      .outerRadius(outerR)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(0)

    const arcFill = d3
      .arc<any>()
      .innerRadius(innerR)
      .outerRadius(outerR)
      .startAngle(startAngle)
      .cornerRadius(0)

    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`)

    // Background arc
    g.append('path')
      .attr('d', arcBg({}) ?? '')
      .attr('fill', '#2A2A2A')

    // Fill arc with animation
    g.append('path')
      .attr('d', arcFill.endAngle(startAngle)({}) ?? '')
      .attr('fill', fillColor)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attrTween('d', function () {
        const interpolate = d3.interpolate(startAngle, fillAngle)
        return function (t: number) {
          return arcFill.endAngle(interpolate(t))({}) ?? ''
        }
      })

    // Center percentage text
    g.append('text')
      .attr('x', 0)
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#EDEBE8')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', `${Math.max(20, outerR * 0.45)}px`)
      .attr('font-weight', '700')
      .text(`${Math.round(pctVal)}%`)

    // Label below
    svg
      .append('text')
      .attr('x', cx)
      .attr('y', h - 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#7A7670')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '11px')
      .text(label)

    return () => {
      svg.selectAll('*').remove()
    }
  }, [value, max, label, thresholds, propSize])

  return (
    <div ref={containerRef} className="flex justify-center">
      <svg ref={svgRef} />
    </div>
  )
}
