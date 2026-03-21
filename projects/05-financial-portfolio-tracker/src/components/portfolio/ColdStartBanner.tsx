'use client'
import { useEffect, useState } from 'react'

const HEALTH_URL =
  (process.env.NEXT_PUBLIC_API_URL || '/api/portfolio') + '/health'

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
      <div className="glass-card px-4 py-3 flex items-start gap-3">
        <span
          className="mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor:
              status === 'retrying'
                ? '#C4841D'
                : 'var(--accent)',
            animation: status === 'ready' ? 'none' : 'pulse 1.4s ease-in-out infinite',
          }}
        />
        <div>
          <p className="font-mono text-[11px] tracking-widest uppercase text-muted-dim mb-0.5">
            {status === 'ready'
              ? 'Listo'
              : status === 'retrying'
              ? 'Iniciando servidor'
              : 'Conectando'}
          </p>
          <p className="font-sans text-xs text-ink leading-relaxed">
            {status === 'ready'
              ? 'Servidor listo.'
              : status === 'retrying'
              ? 'El servidor estuvo inactivo. Puede tardar unos segundos...'
              : 'Conectando con el servidor de portafolio...'}
          </p>
        </div>
      </div>
    </div>
  )
}
