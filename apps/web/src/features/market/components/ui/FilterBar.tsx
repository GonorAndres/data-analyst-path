'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import { useFilter } from '@/features/market/context/FilterContext'

const ROOM_TYPES = ['All', 'Entire home/apt', 'Private room', 'Shared room', 'Hotel room'] as const

const DISPLAY_LABELS: Record<string, string> = {
  'All': 'Todos',
  'Entire home/apt': 'Casa/depto completo',
  'Private room': 'Cuarto privado',
  'Shared room': 'Cuarto compartido',
  'Hotel room': 'Cuarto de hotel',
}

export function FilterBar() {
  const tx = useProjectText()
  const { roomType, setRoomType } = useFilter()

  return (
    <div className="flex flex-wrap gap-2 items-center py-6 border-b border-border">
      <span className="font-sans text-xs tracking-widest uppercase text-muted mr-2">{tx("Filtrar")}</span>
      {ROOM_TYPES.map(rt => (
        <button
          key={rt}
          type="button"
          aria-pressed={roomType === rt}
          onClick={() => setRoomType(rt)}
          className={`font-sans text-xs px-3 py-1.5 border transition-colors ${
            roomType === rt
              ? 'border-ink bg-ink text-paper'
              : 'border-border text-muted hover:border-muted'
          }`}
        >
          {tx(DISPLAY_LABELS[rt])}
        </button>
      ))}
    </div>
  )
}
