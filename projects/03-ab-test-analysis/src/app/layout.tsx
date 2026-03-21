import type { Metadata } from 'next'
import { Playfair_Display, Lora } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'A/B Test Lab -- Andres Gonzalez Ortega',
  description: 'E-Commerce conversion experiment dashboard: frequentist and Bayesian analysis with segment deep dives and sequential monitoring.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'A/B Test Lab -- Andres Gonzalez Ortega',
    description: 'E-Commerce conversion experiment dashboard with statistical rigor.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${lora.variable}`}>
      <head />
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
