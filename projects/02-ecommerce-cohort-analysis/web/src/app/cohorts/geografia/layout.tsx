import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Análisis geográfico — Olist',
  description:
    'Retención, tiempos de entrega y satisfacción por estado brasileño, y la correlación entre logística y recompra.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
