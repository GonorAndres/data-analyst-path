'use client'
import { useEffect, useState } from 'react'

interface Props {
  anyLoading: boolean
  anyError: boolean
  allLoaded: boolean
}

export function ColdStartBanner({ anyLoading, anyError, allLoaded }: Props) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [attempt, setAttempt] = useState(0)

  // Count retries so we can change the message after a few seconds
  useEffect(() => {
    if (!anyError) return
    const t = setInterval(() => setAttempt(n => n + 1), 3000)
    return () => clearInterval(t)
  }, [anyError])

  // Reset attempt counter when data finally loads
  useEffect(() => {
    if (allLoaded) setAttempt(0)
  }, [allLoaded])

  // Fade out 800ms after all data lands, then hide
  useEffect(() => {
    if (!allLoaded) return
    setFading(true)
    const t = setTimeout(() => setVisible(false), 800)
    return () => clearTimeout(t)
  }, [allLoaded])

  // Re-show if filters change and data starts loading again
  useEffect(() => {
    if (anyLoading) {
      setVisible(true)
      setFading(false)
    }
  }, [anyLoading])

  if (!visible) return null
  if (!anyLoading && !anyError && !allLoaded) return null

  const isRetrying = anyError && !anyLoading
  const slowStart = isRetrying && attempt >= 2

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-xs"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}
    >
      <div className="bg-paper dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] px-4 py-3 flex items-start gap-3">
        {/* Animated indicator */}
        <span
          className="mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor: isRetrying ? '#C4841D' : 'var(--bar-rank-1)',
            animation: allLoaded ? 'none' : 'pulse 1.4s ease-in-out infinite',
          }}
        />

        <div>
          <p className="font-sans text-xs tracking-widest uppercase text-muted mb-0.5">
            {allLoaded ? 'Listo' : isRetrying ? 'Iniciando servidor' : 'Cargando datos'}
          </p>
          <p className="font-sans text-xs text-ink dark:text-[#F0EFEB] leading-relaxed">
            {allLoaded
              ? 'Todos los datos han cargado.'
              : slowStart
              ? 'El contenedor está tardando más de lo usual. Reintentando...'
              : isRetrying
              ? 'El servidor estuvo inactivo. Esperando que arranque...'
              : 'Consultando datos de siniestros CAS/NAIC...'}
          </p>
        </div>
      </div>
    </div>
  )
}
