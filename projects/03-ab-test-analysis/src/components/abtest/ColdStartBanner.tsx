'use client'
import { useEffect, useState } from 'react'

const HEALTH_URL =
  (process.env.NEXT_PUBLIC_ABTEST_API_URL || '/api/abtest') + '/health'

export function ColdStartBanner() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [status, setStatus] = useState<'connecting' | 'retrying' | 'ready'>('connecting')
  const attemptRef = { current: 0 }

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function ping() {
      try {
        const res = await fetch(HEALTH_URL)
        if (!cancelled && res.ok) {
          setStatus('ready')
          setFading(true)
          timer = setTimeout(() => setVisible(false), 800)
        } else {
          throw new Error('not ok')
        }
      } catch {
        if (cancelled) return
        attemptRef.current += 1
        if (attemptRef.current >= 2) setStatus('retrying')
        timer = setTimeout(ping, 3000)
      }
    }

    ping()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-xs"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.8s ease' }}
    >
      <div className="bg-paper dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] px-4 py-3 flex items-start gap-3">
        <span
          className="mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor:
              status === 'ready'
                ? 'var(--bar-rank-1, #4A7C59)'
                : status === 'retrying'
                ? '#C4841D'
                : 'var(--bar-rank-1, #4A7C59)',
            animation: status === 'ready' ? 'none' : 'pulse 1.4s ease-in-out infinite',
          }}
        />
        <div>
          <p className="font-sans text-xs tracking-widest uppercase text-muted mb-0.5">
            {status === 'ready'
              ? 'Listo'
              : status === 'retrying'
              ? 'Iniciando servidor'
              : 'Conectando'}
          </p>
          <p className="font-sans text-xs text-ink dark:text-[#F0EFEB] leading-relaxed">
            {status === 'ready'
              ? 'Servidor listo.'
              : status === 'retrying'
              ? 'El servidor estuvo inactivo. Puede tardar unos segundos...'
              : 'Conectando con el servidor de analisis...'}
          </p>
        </div>
      </div>
    </div>
  )
}
