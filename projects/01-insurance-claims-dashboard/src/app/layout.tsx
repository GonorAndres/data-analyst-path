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
  title: 'Insurance Claims Dashboard — Andres Gonzalez Ortega',
  description: 'Reservas y siniestralidad: triangulos de desarrollo, IBNR y ratios combinados con datos CAS/NAIC.',
  openGraph: {
    title: 'Insurance Claims Dashboard — Andres Gonzalez Ortega',
    description: 'Reservas y siniestralidad: triangulos de desarrollo, IBNR y ratios combinados con datos CAS/NAIC.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${playfair.variable} ${lora.variable}`}>
      <head />
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
