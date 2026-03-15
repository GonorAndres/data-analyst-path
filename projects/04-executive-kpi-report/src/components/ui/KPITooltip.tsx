'use client'
import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, TrendingUp, TrendingDown } from 'lucide-react'

interface KPITooltipProps {
  content: string
  hintUp: string
  hintDown: string
  direction?: 'up' | 'down' | 'neutral'
  children: React.ReactNode
}

export function KPITooltip({ content, hintUp, hintDown, direction = 'up', children }: KPITooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  function show() { timerRef.current = setTimeout(() => setVisible(true), 150) }
  function hide() { clearTimeout(timerRef.current); setVisible(false) }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-64 glass-card p-4 shadow-xl pointer-events-none"
          >
            <div className="flex items-start gap-2">
              <Info size={13} className="text-[var(--accent-cyan)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">{content}</p>
            </div>
            {direction !== 'neutral' && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--glass-border)]">
                {direction === 'up'
                  ? <TrendingUp size={11} className="text-[var(--status-green)]" />
                  : <TrendingDown size={11} className="text-[var(--status-green)]" />}
                <span className="text-[10px] text-[var(--fg-muted)]">
                  {direction === 'up' ? hintUp : hintDown}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
