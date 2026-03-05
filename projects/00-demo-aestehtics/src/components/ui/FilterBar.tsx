'use client'
import { useFilter } from '@/context/FilterContext'

const ROOM_TYPES = ['All', 'Entire home/apt', 'Private room', 'Shared room', 'Hotel room'] as const

const DISPLAY_LABELS: Record<string, string> = {
  'All': 'Todos',
  'Entire home/apt': 'Casa/depto completo',
  'Private room': 'Cuarto privado',
  'Shared room': 'Cuarto compartido',
  'Hotel room': 'Cuarto de hotel',
}

export function FilterBar() {
  const { roomType, setRoomType } = useFilter()

  return (
    <div className="flex flex-wrap gap-2 items-center py-6 border-b border-border dark:border-[#2a2a2a]">
      <span className="font-sans text-xs tracking-widest uppercase text-muted mr-2">Filtrar</span>
      {ROOM_TYPES.map(rt => (
        <button
          key={rt}
          onClick={() => setRoomType(rt)}
          className={`font-sans text-xs px-3 py-1.5 border transition-colors ${
            roomType === rt
              ? 'border-ink dark:border-[#F0EFEB] bg-ink dark:bg-[#F0EFEB] text-[#FAFAF8] dark:text-[#1A1A1A]'
              : 'border-border dark:border-[#2a2a2a] text-muted hover:border-muted'
          }`}
        >
          {DISPLAY_LABELS[rt]}
        </button>
      ))}
    </div>
  )
}
