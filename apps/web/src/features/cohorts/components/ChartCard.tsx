'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

import { useId, useState } from 'react'
import { Table2, BarChart3 } from 'lucide-react'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
}

interface Props {
  title: string
  subtitle?: string
  /** Shown under the chart. The "so what?", per the repo's charting standard. */
  insight?: React.ReactNode
  /** Rows behind the chart. Required: the palette validation returned a contrast
   *  WARN on the dark surface, and a table view is the prescribed relief -- so
   *  every chart here can be read without relying on colour at all. */
  tableColumns: Column[]
  tableRows: Record<string, string | number>[]
  children: React.ReactNode
  height?: number
}

export function ChartCard({
  title,
  subtitle,
  insight,
  tableColumns,
  tableRows,
  children,
  height = 340,
}: Props) {
  const tx = useProjectText()
  const [showTable, setShowTable] = useState(false)
  const regionId = useId()

  return (
    <figure className="min-w-0 max-w-full border border-border bg-[var(--chart-bg)] rounded-lg">
      <figcaption className="flex flex-wrap items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div>
          <h3 className="font-serif text-lg leading-snug text-[var(--chart-label)]">{title}</h3>
          {subtitle && <p className="font-sans text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-expanded={showTable}
          aria-controls={regionId}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-sans px-2.5 py-1.5
                     border border-border rounded-sm text-muted
                     hover:text-[var(--chart-label)] transition-colors"
        >
          {showTable ? <BarChart3 size={14} aria-hidden /> : <Table2 size={14} aria-hidden />}
          {showTable ? tx("Ver gráfica") : tx("Ver datos")}
        </button>
      </figcaption>

      <div id={regionId} className="px-2 pb-2">
        {showTable ? (
          <div className="max-h-[340px] overflow-auto px-3">
            <div className="max-w-full overflow-x-auto"><table className="w-full text-sm font-sans border-collapse">
              <thead className="sticky top-0 bg-[var(--chart-bg)]">
                <tr>
                  {tableColumns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={`py-2 px-2 border-b border-border font-medium text-muted ${
                        c.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {tx(c.label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {tableColumns.map((c) => (
                      <td
                        key={c.key}
                        className={`py-1.5 px-2 tabular-nums ${
                          c.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {typeof row[c.key] === 'string' ? tx(String(row[c.key])) : row[c.key] ?? '--'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        ) : (
          <div style={{ height }}>{children}</div>
        )}
      </div>

      {insight && (
        <div className="px-5 py-3 border-t border-border font-sans text-sm leading-relaxed text-muted">
          {insight}
        </div>
      )}
    </figure>
  )
}
