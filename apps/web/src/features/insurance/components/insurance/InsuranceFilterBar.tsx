'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import { useInsuranceFilter } from '@/features/insurance/context/InsuranceFilterContext'
import { useInsuranceFilters } from '@/features/insurance/hooks/useInsuranceAPI'

interface CompanyOption {
  grcode: number
  grname: string
}

interface FilterOptions {
  lobs?: string[]
  companies?: CompanyOption[]
  years?: number[]
}

export function InsuranceFilterBar() {
  const tx = useProjectText()
  const { lob, setLob, company, setCompany, yearStart, setYearStart, yearEnd, setYearEnd } = useInsuranceFilter()
  const { data: filterOptions } = useInsuranceFilters()
  const opts = filterOptions as FilterOptions | undefined

  const selectClass = "max-w-full min-w-0 font-sans text-sm border border-border rounded-md bg-paper text-ink px-3 py-2"

  const years = opts?.years ?? Array.from({ length: 10 }, (_, i) => 1988 + i)

  return (
    <div className="py-6 border-t border-border flex flex-wrap gap-3 items-center">
      <span className="font-sans text-xs tracking-widest uppercase text-muted mr-2">{tx("Filtros")}</span>

      <select aria-label={tx('Línea de negocio')} className={selectClass} value={lob} onChange={e => setLob(e.target.value)}>
        <option value="">{tx("Todas las líneas")}</option>
        {opts?.lobs?.map((l: string) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <select aria-label={tx('Compañía')} className={selectClass} value={company} onChange={e => setCompany(e.target.value)}>
        <option value="">{tx("Todas las compañías")}</option>
        {opts?.companies?.map((c) => (
          <option key={c.grcode} value={c.grcode}>{c.grname}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <select aria-label={tx('Año inicial')} className={selectClass} value={yearStart} onChange={e => { const year = Number(e.target.value); setYearStart(year); if (year > yearEnd) setYearEnd(year) }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="font-sans text-xs text-muted">--</span>
        <select aria-label={tx('Año final')} className={selectClass} value={yearEnd} onChange={e => { const year = Number(e.target.value); setYearEnd(year); if (year < yearStart) setYearStart(year) }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}
