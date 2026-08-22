import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Retención por cohortes — Olist',
  description:
    'Mapa de calor de retención, curva promedio con intervalo de confianza, mejor contra peor cohorte y supervivencia Kaplan-Meier.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
