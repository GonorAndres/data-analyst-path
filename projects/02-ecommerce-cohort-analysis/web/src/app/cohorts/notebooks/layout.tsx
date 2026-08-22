import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Proceso técnico — Análisis de Cohortes Olist',
  description:
    'Los cuatro notebooks de Jupyter detrás del tablero: limpieza, exploración, retención y RFM/LTV, con todo el código y sus salidas.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
