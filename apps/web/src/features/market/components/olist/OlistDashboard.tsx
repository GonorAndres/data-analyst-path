'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import { hasSeries } from '@/features/market/components/hasSeries'
import { OlistFilterProvider, useOlistFilter } from '@/features/market/context/OlistFilterContext'
import { OlistFilterBar } from '@/features/market/components/olist/OlistFilterBar'
import { CohortHeatmap } from '@/features/market/components/olist/CohortHeatmap'
import { RevenueTimeline } from '@/features/market/components/olist/RevenueTimeline'
import { LTVCurves } from '@/features/market/components/olist/LTVCurves'
import { CategoryBreakdown } from '@/features/market/components/olist/CategoryBreakdown'
import { GeoStatesBar } from '@/features/market/components/olist/GeoStatesBar'
import { DeliveryReview } from '@/features/market/components/olist/DeliveryReview'
import { RFMSegments } from '@/features/market/components/olist/RFMSegments'
import { ColdStartBanner } from '@/features/market/components/olist/ColdStartBanner'
import { ChartContainer } from '@/features/market/components/ui/ChartContainer'
import { KPICard } from '@/features/market/components/ui/KPICard'
import { DatasetInfo } from '@/features/market/components/ui/DatasetInfo'
import {
  useOlistKPIs,
  useCohortRetention,
  useRevenueTrends,
  useLTVCurves,
  useCategoryBreakdown,
  useGeoStates,
  useDeliveryReview,
  useRFM,
} from '@/features/market/hooks/useOlistAPI'

function OlistDashboardInner() {
  const tx = useProjectText()
  const filters = useOlistFilter()
  const filterValues = {
    category: filters.category,
    state: filters.state,
    paymentType: filters.paymentType,
    yearStart: filters.yearStart,
    yearEnd: filters.yearEnd,
  }

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useOlistKPIs(filterValues)
  const { data: cohortData, isLoading: cohortLoading, error: cohortError } = useCohortRetention(filterValues)
  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useRevenueTrends(filterValues)
  const { data: ltvData, isLoading: ltvLoading, error: ltvError } = useLTVCurves(filterValues)
  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useCategoryBreakdown(filterValues)
  const { data: geoData, isLoading: geoLoading, error: geoError } = useGeoStates(filterValues)
  const { data: deliveryData, isLoading: deliveryLoading, error: deliveryError } = useDeliveryReview(filterValues)
  const { data: rfmData, isLoading: rfmLoading, error: rfmError } = useRFM(filterValues)

  const anyLoading = kpisLoading || cohortLoading || revenueLoading || ltvLoading || categoryLoading || geoLoading || deliveryLoading || rfmLoading
  const anyError = !!(kpisError || cohortError || revenueError || ltvError || categoryError || geoError || deliveryError || rfmError)
  const allLoaded = !!(kpis && cohortData && revenueData && ltvData && categoryData && geoData && deliveryData && rfmData)

  return (
    <div className="min-h-screen bg-paper text-ink">
      <ColdStartBanner anyLoading={anyLoading} anyError={anyError} allLoaded={allLoaded} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Title section */}
        <section className="pt-8 pb-6 border-b border-border">
          <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">{tx("Caso de Estudio 02 — Marzo 2026")}</p>
          <h1 className="font-serif text-3xl md:text-4xl leading-none tracking-tight mb-6">
            {tx('Olist — comercio electrónico')}
          </h1>
          <p className="font-sans text-base text-muted max-w-xl leading-relaxed">
            {tx("Retención de clientes por cohorte, valor de vida del cliente y patrones de entrega en el marketplace más grande de Brasil. Datos de Olist vía Kaggle — 2016 a 2018.")}</p>

          <DatasetInfo
            source={{ label: "Olist — Kaggle", url: "https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce" }}
            period={tx("Septiembre 2016 a octubre 2018 (25 meses)")}
            records={tx("99,441 pedidos entregados de 96,096 clientes únicos")}
            description={tx("Olist es el marketplace de e-commerce más grande de Brasil, conectando pequeños comerciantes con los principales canales de venta en línea. Este dataset público de Kaggle contiene información real y anonimizada de pedidos: productos, pagos, reseñas, tiempos de entrega y geolocalización de clientes y vendedores.")}
            limitations={[
              tx("Solo pedidos con estatus 'entregado' (excluye cancelados y en proceso)"),
              tx("Categorías de producto en portugués (72+ categorías)"),
              tx("Marketplace multi-vendedor — la baja retención es característica del modelo, no un problema de datos"),
              tx("~13% de pedidos no tienen reseña del cliente"),
            ]}
          />
        </section>

        {/* KPI Bar */}
        <section className="py-12 border-b border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-border">
            <div className="md:pr-8">
              <KPICard label={tx("Pedidos totales")} value={kpisError || kpisLoading ? undefined : (kpis as Record<string, number> | undefined)?.total_orders} delay={0} />
            </div>
            <div className="md:px-8">
              <KPICard label={tx("Clientes únicos")} value={kpisError || kpisLoading ? undefined : (kpis as Record<string, number> | undefined)?.unique_customers} delay={0.1} />
            </div>
            <div className="md:px-8">
              <KPICard label={tx("Valor promedio de pedido")} value={kpisError || kpisLoading ? undefined : (kpis as Record<string, number> | undefined)?.avg_order_value} prefix="R$ " decimals={0} delay={0.2} />
            </div>
            <div className="md:pl-8">
              <KPICard label={tx("Días de entrega promedio")} value={kpisError || kpisLoading ? undefined : (kpis as Record<string, number> | undefined)?.avg_delivery_days} suffix={tx(" días")} decimals={1} delay={0.3} />
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <OlistFilterBar />

        {/* Revenue Timeline */}
        <ChartContainer
          title={tx("Ingresos mensuales")}
          loading={revenueLoading} error={revenueError} empty={!hasSeries(revenueData, 'months')}
          subtitle={tx("Evolución de ingresos y volumen de pedidos a lo largo del tiempo.")}
          insight={tx("Los ingresos del marketplace crecieron de forma sostenida entre 2017 y 2018, con picos en noviembre (Black Friday) y un ticket promedio relativamente estable.")}
        >
          <RevenueTimeline data={revenueData as { months: { month: string; order_count: number; revenue: number; avg_value: number }[] } | undefined} isLoading={revenueLoading} />
        </ChartContainer>

        {/* Cohort Retention Heatmap */}
        <ChartContainer
          title={tx("Retención por cohorte")}
          loading={cohortLoading} error={cohortError} empty={!hasSeries(cohortData, 'cohorts')}
          subtitle={tx("Porcentaje de clientes que regresaron a comprar en los meses siguientes a su primera orden.")}
          insight={tx("La retención cae drásticamente después del primer mes — menos del 5% de los clientes realiza un segundo pedido en los siguientes 3 meses. Las cohortes de 2017 muestran retención ligeramente superior.")}
        >
          <CohortHeatmap data={cohortData as { cohorts: string[]; months: number[]; matrix: number[][]; cohort_sizes: number[] } | undefined} isLoading={cohortLoading} />
        </ChartContainer>

        {/* LTV Curves */}
        <ChartContainer
          title={tx("Valor de vida del cliente")}
          loading={ltvLoading} error={ltvError} empty={!hasSeries(ltvData, 'curves')}
          subtitle={tx("LTV histórico: ingreso acumulado total de cada cohorte dividido entre su número de clientes. Si una cohorte muestra R$ 171, significa que el cliente promedio gastó R$ 171 en total desde su primera compra.")}
          insight={tx("Las cohortes más grandes generan entre R$150–250 de valor acumulado por cliente. La mayor parte del gasto se concentra en los primeros 2 meses — después la curva se aplana.")}
        >
          <LTVCurves data={ltvData as { cohorts: string[]; curves: { cohort: string; size: number; points: { month: number; ltv: number }[] }[] } | undefined} isLoading={ltvLoading} />
        </ChartContainer>

        {/* Category Breakdown */}
        <ChartContainer
          title={tx("Categorías principales")}
          loading={categoryLoading} error={categoryError} empty={!hasSeries(categoryData, 'categories')}
          subtitle={tx("Top 15 categorías de producto ordenadas por ingreso total.")}
          insight={tx("Salud y belleza, relojes y cama/mesa/baño dominan los ingresos. Las categorías de mayor ticket no siempre son las de mayor volumen de pedidos.")}
        >
          <CategoryBreakdown data={categoryData as { categories: { name: string; revenue: number; order_count: number; avg_price: number }[] } | undefined} isLoading={categoryLoading} />
        </ChartContainer>

        {/* Geo States */}
        <ChartContainer
          title={tx("Ventas por estado")}
          loading={geoLoading} error={geoError} empty={!hasSeries(geoData, 'states')}
          subtitle={tx("Distribución geográfica de pedidos, valor promedio y calificación por estado brasileño.")}
          insight={tx("São Paulo concentra más del 40% de los pedidos. Los estados del noreste muestran calificaciones de reseña ligeramente menores, correlacionado con tiempos de entrega más largos.")}
        >
          <GeoStatesBar data={geoData as { states: { state: string; order_count: number; avg_order_value: number; avg_review_score: number | null }[] } | undefined} isLoading={geoLoading} />
        </ChartContainer>

        {/* Delivery vs Review */}
        <ChartContainer
          title={tx("Entrega vs. calificación")}
          loading={deliveryLoading} error={deliveryError} empty={!hasSeries(deliveryData, 'bins')}
          subtitle={tx("Relación entre tiempo de entrega, calificación promedio y porcentaje de entregas tardías.")}
          insight={tx("Entregas en 0-7 días promedian 4.3 estrellas. A partir de 21 días, la calificación cae por debajo de 3.5 y el porcentaje de entregas tardías supera el 50%.")}
        >
          <DeliveryReview data={deliveryData as { bins: { bin: string; avg_review: number; order_count: number; pct_late: number }[] } | undefined} isLoading={deliveryLoading} />
        </ChartContainer>

        {/* RFM Segments */}
        <ChartContainer
          title={tx("Segmentación RFM")}
          loading={rfmLoading} error={rfmError} empty={!hasSeries(rfmData, 'segments')}
          subtitle={tx("Recencia, Frecuencia y Valor Monetario — las tres dimensiones que clasifican a cada cliente por su comportamiento de compra. RFM es más discriminante cuando la frecuencia promedio es >= 2 (negocios con recompra natural: suscripciones, retail, SaaS). En Olist, con ~97% de clientes de compra única, la dimensión F colapsa y la segmentación depende principalmente de R y M.")}
          insight={tx("La frecuencia promedio de 1.03 pedidos por cliente confirma que Olist opera como un marketplace de compra única — típico de plataformas multi-vendedor donde el cliente no tiene lealtad a Olist sino al producto. Los segmentos 'Alto valor recurrente' y 'Recurrentes estables' (~3% del total) representan a los escasos clientes que regresaron; en ellos se concentra el mayor retorno potencial de campañas de retención. En un negocio con mayor recurrencia, el modelo RFM separaría segmentos más equilibrados y accionables.")}
        >
          <RFMSegments data={rfmData as { segments: { segment: string; count: number; avg_recency: number; avg_frequency: number; avg_monetary: number }[] } | undefined} isLoading={rfmLoading} />
        </ChartContainer>
      </main>
    </div>
  )
}

export function OlistDashboard() {
  return (
    <OlistFilterProvider>
      <OlistDashboardInner />
    </OlistFilterProvider>
  )
}
