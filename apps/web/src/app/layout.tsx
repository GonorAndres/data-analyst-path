import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SitePreferences } from '@/components/SitePreferences'
import { SiteShell } from '@/components/SiteShell'
import { Analytics } from '@/components/Analytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://data-analyst.gonor.me'),
  title: 'Andrés González Ortega — Data Analyst',
  description: 'Business questions, interactive analysis, and transparent methods. An analytics portfolio across insurance, e-commerce, finance, and operations.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning className={inter.variable}>
    <head><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('analyst-theme')||localStorage.getItem('theme')||localStorage.getItem('kpi-theme');document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t==='dark'?'dark':'light'}catch(e){}" }} /></head>
    <body><SitePreferences><SiteShell>{children}</SiteShell><Analytics /></SitePreferences></body>
  </html>
}
