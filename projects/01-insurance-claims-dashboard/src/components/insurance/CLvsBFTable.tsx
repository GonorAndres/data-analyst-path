'use client'

interface ComparisonRow {
  accident_year: number
  cl_ibnr: number
  bf_ibnr: number
  cl_ultimate: number
  bf_ultimate: number
  difference: number
  pct_diff: number
}

interface CLvsBFData {
  comparison: ComparisonRow[]
}

interface Props {
  data: CLvsBFData | undefined
  isLoading: boolean
}

function formatAmount(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

export function CLvsBFTable({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 200 }} />
  }

  if (!data.comparison?.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 120 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const totalCL = data.comparison.reduce((s, r) => s + r.cl_ibnr, 0)
  const totalBF = data.comparison.reduce((s, r) => s + r.bf_ibnr, 0)
  const totalDiff = totalBF - totalCL
  const totalPct = totalCL !== 0 ? (totalDiff / totalCL * 100) : 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-sans text-xs">
        <thead>
          <tr className="border-b border-border dark:border-[#2a2a2a]">
            <th className="text-left py-2 pr-4 text-muted font-medium">Ano</th>
            <th className="text-right py-2 px-4 text-muted font-medium">IBNR (CL)</th>
            <th className="text-right py-2 px-4 text-muted font-medium">IBNR (BF)</th>
            <th className="text-right py-2 px-4 text-muted font-medium">Diferencia</th>
            <th className="text-right py-2 pl-4 text-muted font-medium">% Dif</th>
          </tr>
        </thead>
        <tbody>
          {data.comparison.map(row => (
            <tr key={row.accident_year} className="border-b border-border/50 dark:border-[#2a2a2a]/50">
              <td className="py-1.5 pr-4 tabular-nums">{row.accident_year}</td>
              <td className="py-1.5 px-4 text-right tabular-nums">{formatAmount(row.cl_ibnr)}</td>
              <td className="py-1.5 px-4 text-right tabular-nums">{formatAmount(row.bf_ibnr)}</td>
              <td className={`py-1.5 px-4 text-right tabular-nums ${row.difference > 0 ? 'text-[var(--ratio-loss)]' : row.difference < 0 ? 'text-[var(--ratio-profitable)]' : ''}`}>
                {row.difference > 0 ? '+' : ''}{formatAmount(row.difference)}
              </td>
              <td className={`py-1.5 pl-4 text-right tabular-nums ${row.pct_diff > 0 ? 'text-[var(--ratio-loss)]' : row.pct_diff < 0 ? 'text-[var(--ratio-profitable)]' : ''}`}>
                {row.pct_diff > 0 ? '+' : ''}{row.pct_diff.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border dark:border-[#2a2a2a] font-semibold">
            <td className="py-2 pr-4">Total</td>
            <td className="py-2 px-4 text-right tabular-nums">{formatAmount(totalCL)}</td>
            <td className="py-2 px-4 text-right tabular-nums">{formatAmount(totalBF)}</td>
            <td className={`py-2 px-4 text-right tabular-nums ${totalDiff > 0 ? 'text-[var(--ratio-loss)]' : totalDiff < 0 ? 'text-[var(--ratio-profitable)]' : ''}`}>
              {totalDiff > 0 ? '+' : ''}{formatAmount(totalDiff)}
            </td>
            <td className={`py-2 pl-4 text-right tabular-nums ${totalPct > 0 ? 'text-[var(--ratio-loss)]' : totalPct < 0 ? 'text-[var(--ratio-profitable)]' : ''}`}>
              {totalPct > 0 ? '+' : ''}{totalPct.toFixed(1)}%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
