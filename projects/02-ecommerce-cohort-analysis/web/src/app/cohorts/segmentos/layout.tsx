import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Segmentos de clientes — Olist',
  description:
    'Segmentación RFM, mapa de recencia contra frecuencia, curvas de LTV, factores de activación y concentración de ingresos.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
