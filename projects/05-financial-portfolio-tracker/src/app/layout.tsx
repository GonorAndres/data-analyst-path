import type { Metadata } from 'next'
import { Playfair_Display, Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Portfolio Tracker -- Andres Gonzalez Ortega',
  description: 'Financial portfolio analytics dashboard: performance attribution, risk metrics, Monte Carlo simulation, and efficient frontier optimization.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Portfolio Tracker -- Andres Gonzalez Ortega',
    description: 'Financial portfolio analytics with risk metrics and optimization.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <head />
      <body className="antialiased bg-bg text-ink">
        {children}
      </body>
    </html>
  )
}
