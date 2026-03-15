import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Executive KPI Report -- Andres Gonzalez Ortega',
  description: 'SaaS executive dashboard with automated KPI tracking, anomaly detection, and forecasting for NovaCRM.',
  openGraph: {
    title: 'Executive KPI Report -- Andres Gonzalez Ortega',
    description: 'SaaS executive dashboard: MRR, churn, NPS tracking with anomaly detection and forecasting.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${inter.variable}`}>
      <head />
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
