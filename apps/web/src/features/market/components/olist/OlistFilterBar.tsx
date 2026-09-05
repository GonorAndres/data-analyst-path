'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import { useOlistFilter } from '@/features/market/context/OlistFilterContext'
import { useOlistFilters } from '@/features/market/hooks/useOlistAPI'

export function OlistFilterBar() {
  const tx = useProjectText()
  const { category, setCategory, state, setState, paymentType, setPaymentType, yearStart, setYearStart, yearEnd, setYearEnd } = useOlistFilter()
  const { data: filterOptions } = useOlistFilters()

  const selectClass = "max-w-full min-w-0 font-sans text-sm border border-border rounded-md bg-paper text-ink px-3 py-2"

  return (
    <div className="py-6 border-t border-border flex flex-wrap gap-3 items-center">
      <span className="font-sans text-xs tracking-widest uppercase text-muted mr-2">{tx("Filtros")}</span>

      <select aria-label={tx('Categoría')} className={selectClass} value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">{tx("Todas las categorías")}</option>
        {(filterOptions as Record<string, string[]> | undefined)?.product_categories?.map((c: string) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select aria-label={tx('Estado')} className={selectClass} value={state} onChange={e => setState(e.target.value)}>
        <option value="">{tx("Todos los estados")}</option>
        {(filterOptions as Record<string, string[]> | undefined)?.states?.map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select aria-label={tx('Medio de pago')} className={selectClass} value={paymentType} onChange={e => setPaymentType(e.target.value)}>
        <option value="">{tx("Todos los pagos")}</option>
        {(filterOptions as Record<string, string[]> | undefined)?.payment_types?.map((p: string) => (
          <option key={p} value={p}>{tx(({ credit_card: 'Tarjeta de crédito', debit_card: 'Tarjeta de débito', boleto: 'Boleto bancario', voucher: 'Vale', not_defined: 'Sin especificar' } as Record<string, string>)[p] ?? p)}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <select aria-label={tx('Año inicial')} className={selectClass} value={yearStart} onChange={e => { const year = Number(e.target.value); setYearStart(year); if (year > yearEnd) setYearEnd(year) }}>
          {[2016, 2017, 2018].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="font-sans text-xs text-muted">—</span>
        <select aria-label={tx('Año final')} className={selectClass} value={yearEnd} onChange={e => { const year = Number(e.target.value); setYearEnd(year); if (year < yearStart) setYearStart(year) }}>
          {[2016, 2017, 2018].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}
