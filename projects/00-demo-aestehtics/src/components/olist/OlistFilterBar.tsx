'use client'
import { useOlistFilter } from '@/context/OlistFilterContext'
import { useOlistFilters } from '@/hooks/useOlistAPI'

export function OlistFilterBar() {
  const { category, setCategory, state, setState, paymentType, setPaymentType, yearStart, setYearStart, yearEnd, setYearEnd } = useOlistFilter()
  const { data: filterOptions } = useOlistFilters()

  const selectClass = "font-sans text-xs border border-border dark:border-[#2a2a2a] bg-paper dark:bg-[#141414] text-ink dark:text-[#F0EFEB] px-3 py-1.5 focus:outline-none"

  return (
    <div className="py-6 border-t border-border dark:border-[#2a2a2a] flex flex-wrap gap-3 items-center">
      <span className="font-sans text-xs tracking-widest uppercase text-muted mr-2">Filtros</span>

      <select className={selectClass} value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">Todas las categorías</option>
        {(filterOptions as Record<string, string[]> | undefined)?.product_categories?.map((c: string) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select className={selectClass} value={state} onChange={e => setState(e.target.value)}>
        <option value="">Todos los estados</option>
        {(filterOptions as Record<string, string[]> | undefined)?.states?.map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select className={selectClass} value={paymentType} onChange={e => setPaymentType(e.target.value)}>
        <option value="">Todos los pagos</option>
        {(filterOptions as Record<string, string[]> | undefined)?.payment_types?.map((p: string) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <select className={selectClass} value={yearStart} onChange={e => setYearStart(Number(e.target.value))}>
          {[2016, 2017, 2018].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="font-sans text-xs text-muted">—</span>
        <select className={selectClass} value={yearEnd} onChange={e => setYearEnd(Number(e.target.value))}>
          {[2016, 2017, 2018].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}
