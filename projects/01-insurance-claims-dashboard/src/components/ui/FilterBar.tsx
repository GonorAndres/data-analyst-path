'use client'

interface FilterBarProps {
  children: React.ReactNode
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center py-6 border-b border-border dark:border-[#2a2a2a]">
      <span className="font-sans text-xs tracking-widest uppercase text-muted mr-2">Filtrar</span>
      {children}
    </div>
  )
}
