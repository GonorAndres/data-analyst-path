'use client'

interface StatusBadgeProps {
  status: 'green' | 'yellow' | 'red' | 'critical' | 'warning' | 'info'
  label?: string
  size?: 'sm' | 'md'
}

const statusMap: Record<string, { dot: string; text: string; bg: string }> = {
  green: {
    dot: 'status-dot status-dot-green',
    text: 'text-[var(--status-green)]',
    bg: 'bg-[var(--status-green)]/10 border-[var(--status-green)]/20',
  },
  yellow: {
    dot: 'status-dot status-dot-yellow',
    text: 'text-[var(--status-yellow)]',
    bg: 'bg-[var(--status-yellow)]/10 border-[var(--status-yellow)]/20',
  },
  red: {
    dot: 'status-dot status-dot-red',
    text: 'text-[var(--status-red)]',
    bg: 'bg-[var(--status-red)]/10 border-[var(--status-red)]/20',
  },
  critical: {
    dot: 'status-dot status-dot-red',
    text: 'text-[var(--status-red)]',
    bg: 'bg-[var(--status-red)]/10 border-[var(--status-red)]/20',
  },
  warning: {
    dot: 'status-dot status-dot-yellow',
    text: 'text-[var(--status-yellow)]',
    bg: 'bg-[var(--status-yellow)]/10 border-[var(--status-yellow)]/20',
  },
  info: {
    dot: 'status-dot status-dot-green',
    text: 'text-[var(--accent-cyan)]',
    bg: 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/20',
  },
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const s = statusMap[status] || statusMap.green
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full border ${s.bg} ${s.text} font-medium`}>
      <span className={s.dot} />
      {label && <span>{label}</span>}
    </span>
  )
}
