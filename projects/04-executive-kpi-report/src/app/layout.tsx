import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
  icons: { icon: '/favicon.svg' },
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
      <head>
        <Script id="posthog-init" strategy="afterInteractive">
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing identify alias people.set people.set_once set_config reset get_distinct_id getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onFeatureFlags onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('phc_DYrSznvPeJuXPHgj2Nw9BIluiGdwkbuSSih3lu6PtmH',{api_host:'https://us.i.posthog.com',autocapture:true,capture_pageview:true,capture_pageleave:true,mask_all_text:false,session_recording:{maskAllInputs:true}});`}
        </Script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
