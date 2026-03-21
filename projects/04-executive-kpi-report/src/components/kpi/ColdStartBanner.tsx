'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const HEALTH_URL =
  (process.env.NEXT_PUBLIC_KPI_API_URL || '/api/kpi') + '/health'

const messages = {
  en: {
    connecting: { title: 'Connecting', body: 'Connecting to the analytics server...' },
    retrying: { title: 'Starting server', body: 'The server was idle. It may take a few seconds...' },
    ready: { title: 'Ready', body: 'Server ready.' },
  },
  es: {
    connecting: { title: 'Conectando', body: 'Conectando con el servidor de analisis...' },
    retrying: { title: 'Iniciando servidor', body: 'El servidor estuvo inactivo. Puede tardar unos segundos...' },
    ready: { title: 'Listo', body: 'Servidor listo.' },
  },
}

export function ColdStartBanner() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [status, setStatus] = useState<'connecting' | 'retrying' | 'ready'>('connecting')
  const { language } = useLanguage()
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

  const m = messages[language][status]

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-xs"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.8s ease' }}
    >
      <div
        className="px-4 py-3 flex items-start gap-3"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--fg-muted)',
          borderColor: 'color-mix(in srgb, var(--fg-muted) 30%, transparent)',
        }}
      >
        <span
          className="mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor:
              status === 'retrying'
                ? '#C4841D'
                : 'var(--accent-cyan)',
            animation: status === 'ready' ? 'none' : 'pulse 1.4s ease-in-out infinite',
          }}
        />
        <div>
          <p
            className="text-xs tracking-widest uppercase mb-0.5"
            style={{ color: 'var(--fg-muted)' }}
          >
            {m.title}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--fg-primary)' }}
          >
            {m.body}
          </p>
        </div>
      </div>
    </div>
  )
}
