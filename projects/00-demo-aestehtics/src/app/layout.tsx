import type { Metadata } from 'next'
import { Playfair_Display, Lora } from 'next/font/google'
import Script from 'next/script'
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
  title: 'Andrés González Ortega — Analista de Datos',
  description: 'Portafolio de análisis de datos: seguros, e-commerce y analítica financiera.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Andrés González Ortega — Analista de Datos',
    description: 'Portafolio de análisis de datos: seguros, e-commerce y analítica financiera.',
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
      <head>
        <Script id="posthog-init" strategy="afterInteractive">
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing identify alias people.set people.set_once set_config reset get_distinct_id getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onFeatureFlags onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);var CANONICAL_HOST='data-analyst.gonor.me';posthog.init('phc_DYrSznvPeJuXPHgj2Nw9BIluiGdwkbuSSih3lu6PtmH',{api_host:'/ingest',ui_host:'https://us.posthog.com',autocapture:true,capture_pageview:'history_change',capture_pageleave:true,session_recording:{maskAllInputs:true}});posthog.register({app_id:'data-analyst-hub',canonical_host:CANONICAL_HOST,deployment_platform:'cloudflare-pages',environment:location.hostname===CANONICAL_HOST?'production':'preview',analytics_schema_version:1});`}
        </Script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
