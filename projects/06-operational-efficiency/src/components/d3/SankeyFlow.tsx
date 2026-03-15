'use client'
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey'

interface SankeyNodeDatum {
  id: string
  name: string
}

interface SankeyLinkDatum {
  source: string
  target: string
  value: number
}

interface SankeyFlowProps {
  data: {
    nodes: SankeyNodeDatum[]
    links: SankeyLinkDatum[]
  }
  width?: number
  height?: number
}

const COLUMN_COLORS = ['#D4A15E', '#7EB8DA', '#6FCF97', '#F2C94C']

export function SankeyFlow({ data, width: propWidth, height: propHeight }: SankeyFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data || !data.nodes.length || !data.links.length) return
    if (!svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const w = propWidth || container.clientWidth
    const h = propHeight || 500
    const margin = { top: 10, right: 160, bottom: 10, left: 10 }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h)

    // Build index maps for sankey
    const nodeMap = new Map(data.nodes.map((n, i) => [n.id, i]))

    const sankeyNodes = data.nodes.map((n) => ({ ...n }))
    const sankeyLinks = data.links
      .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map((l) => ({
        source: nodeMap.get(l.source)!,
        target: nodeMap.get(l.target)!,
        value: l.value,
      }))

    const sankeyGenerator = sankey<typeof sankeyNodes[0], typeof sankeyLinks[0]>()
      .nodeId(((_d: unknown, i: number) => i) as any)
      .nodeWidth(16)
      .nodePadding(12)
      .extent([
        [margin.left, margin.top],
        [w - margin.right, h - margin.bottom],
      ])

    const graph = sankeyGenerator({
      nodes: sankeyNodes.map((d) => ({ ...d })),
      links: sankeyLinks.map((d) => ({ ...d })),
    })

    // Determine column positions for color mapping
    const columns = new Set(graph.nodes.map((n: any) => n.depth ?? n.layer ?? 0))
    const maxCol = Math.max(...Array.from(columns) as number[])

    function getNodeColor(node: any): string {
      const depth = node.depth ?? node.layer ?? 0
      const idx = maxCol > 0 ? Math.round((depth / maxCol) * (COLUMN_COLORS.length - 1)) : 0
      return COLUMN_COLORS[Math.min(idx, COLUMN_COLORS.length - 1)]
    }

    // Find bottleneck node (highest throughput)
    const maxValue = d3.max(graph.nodes, (n: any) => n.value) ?? 0

    const tooltip = d3.select(tooltipRef.current)

    // Draw links
    const linkGroup = svg.append('g').attr('fill', 'none')

    linkGroup
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal() as any)
      .attr('stroke', (_d: any) => '#5A5550')
      .attr('stroke-width', (d: any) => Math.max(1, d.width ?? 1))
      .attr('stroke-opacity', 0.3)
      .on('mouseenter', function (event: MouseEvent, d: any) {
        d3.select(this).attr('stroke-opacity', 0.6)
        const srcName = graph.nodes[typeof d.source === 'object' ? (d.source as any).index : d.source]?.name ?? ''
        const tgtName = graph.nodes[typeof d.target === 'object' ? (d.target as any).index : d.target]?.name ?? ''
        tooltip
          .style('display', 'block')
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`)
          .html(
            `<span style="color:#7A7670">${srcName}</span> → <span style="color:#7A7670">${tgtName}</span><br/><span style="color:#EDEBE8;font-weight:600">${d3.format(',')(d.value)}</span>`
          )
      })
      .on('mousemove', function (event: MouseEvent) {
        tooltip
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`)
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke-opacity', 0.3)
        tooltip.style('display', 'none')
      })

    // Draw nodes
    const nodeGroup = svg.append('g')

    nodeGroup
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', (d: any) => d.x0 ?? 0)
      .attr('y', (d: any) => d.y0 ?? 0)
      .attr('width', (d: any) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('height', (d: any) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('fill', (d: any) => getNodeColor(d))
      .attr('rx', 0)
      .style('filter', (d: any) =>
        d.value === maxValue
          ? 'drop-shadow(0 0 8px rgba(239,68,68,0.6))'
          : 'none'
      )
      .on('mouseenter', function (event: MouseEvent, d: any) {
        tooltip
          .style('display', 'block')
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`)
          .html(
            `<span style="color:#EDEBE8;font-weight:600">${d.name}</span><br/><span style="color:#7A7670">Volumen: ${d3.format(',')(d.value)}</span>`
          )
      })
      .on('mousemove', function (event: MouseEvent) {
        tooltip
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`)
      })
      .on('mouseleave', function () {
        tooltip.style('display', 'none')
      })

    // Draw node labels
    nodeGroup
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', (d: any) => ((d.x0 ?? 0) < w / 2 ? (d.x1 ?? 0) + 6 : (d.x0 ?? 0) - 6))
      .attr('y', (d: any) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => ((d.x0 ?? 0) < w / 2 ? 'start' : 'end'))
      .attr('fill', '#EDEBE8')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '11px')
      .text((d: any) => {
        const name = d.name ?? ''
        return name.length > 22 ? name.slice(0, 20) + '...' : name
      })

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
