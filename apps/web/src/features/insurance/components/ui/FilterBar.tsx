'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

interface FilterBarProps {
  children: React.ReactNode
}

export function FilterBar({ children }: FilterBarProps) {
  const tx = useProjectText()
  return (
    <div className="flex flex-wrap gap-2 items-center py-6 border-b border-border">
      <span className="font-sans text-xs tracking-widest uppercase text-muted mr-2">{tx("Filtrar")}</span>
      {children}
    </div>
  )
}
