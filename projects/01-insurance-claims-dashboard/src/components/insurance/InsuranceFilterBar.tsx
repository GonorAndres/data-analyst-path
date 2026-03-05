'use client'
import { useInsuranceFilter } from '@/context/InsuranceFilterContext'
import { useInsuranceFilters } from '@/hooks/useInsuranceAPI'

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
  const { lob, setLob, company, setCompany, yearStart, setYearStart, yearEnd, setYearEnd } = useInsuranceFilter()
  const { data: filterOptions } = useInsuranceFilters()
  const opts = filterOptions as FilterOptions | undefined

  const selectClass = "font-sans text-xs border border-border dark:border-[#2a2a2a] bg-paper dark:bg-[#141414] text-ink dark:text-[#F0EFEB] px-3 py-1.5 focus:outline-none"

  const years = opts?.years ?? Array.from({ length: 10 }, (_, i) => 1988 + i)

  return (
    <div className="py-6 border-t border-border dark:border-[#2a2a2a] flex flex-wrap gap-3 items-center">
      <span className="font-sans text-xs tracking-widest uppercase text-muted mr-2">Filtros</span>

      <select className={selectClass} value={lob} onChange={e => setLob(e.target.value)}>
        <option value="">Todas las líneas</option>
        {opts?.lobs?.map((l: string) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <select className={selectClass} value={company} onChange={e => setCompany(e.target.value)}>
        <option value="">Todas las compañías</option>
        {opts?.companies?.map((c) => (
          <option key={c.grcode} value={c.grcode}>{c.grname}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <select className={selectClass} value={yearStart} onChange={e => setYearStart(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="font-sans text-xs text-muted">--</span>
        <select className={selectClass} value={yearEnd} onChange={e => setYearEnd(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}
