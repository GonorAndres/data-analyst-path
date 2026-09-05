'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

const bootstrap = "!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(\".\");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement(\"script\")).type=\"text/javascript\",p.crossOrigin=\"anonymous\",p.async=!0,p.src=s.api_host+\"/static/array.js\",(r=t.getElementsByTagName(\"script\")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a=\"posthog\",u.people=u.people||[],u.toString=function(t){var e=\"posthog\";return\"posthog\"!==a&&(e+=\".\"+a),t||(e+=\" (stub)\"),e},u.people.toString=function(){return u.toString(1)+\".people (stub)\"},o=\"init capture register register_once unregister opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing identify alias people.set people.set_once set_config reset get_distinct_id getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onFeatureFlags onSessionId setPersonProperties\".split(\" \"),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('phc_DYrSznvPeJuXPHgj2Nw9BIluiGdwkbuSSih3lu6PtmH',{api_host:'/ingest',ui_host:'https://us.posthog.com',autocapture:true,capture_pageview:false,capture_pageleave:true,session_recording:{maskAllInputs:true}});"

const ids: Record<string, string> = { insurance: 'insurance-claims', cohorts: 'ecommerce-cohorts', abtest: 'ab-test-analysis', kpi: 'executive-kpi-report', portfolio: 'financial-portfolio-tracker', operations: 'operational-efficiency', airbnb: 'airbnb-cdmx', olist: 'olist-ecommerce' }
type Client = { register: (properties: Record<string, unknown>) => void; capture: (event: string, properties?: Record<string, unknown>) => void }

export function Analytics() {
  const pathname = usePathname()
  const lastPage = useRef('')
  const capture = useCallback(() => {
    const client = (window as unknown as { posthog?: Client }).posthog
    if (!client || lastPage.current === pathname) return
    lastPage.current = pathname
    const properties = { app_id: ids[pathname.split('/')[1]] || 'data-analyst-hub', canonical_host: 'data-analyst.gonor.me', deployment_platform: 'cloudflare-pages', environment: location.hostname === 'data-analyst.gonor.me' ? 'production' : 'preview', analytics_schema_version: 2 }
    client.register(properties)
    client.capture('$pageview', { ...properties, $current_url: location.href })
  }, [pathname])
  useEffect(capture, [capture])
  if (process.env.NODE_ENV === 'development') return null
  return <Script id="analyst-analytics" strategy="afterInteractive" onReady={capture}>{bootstrap}</Script>
}
