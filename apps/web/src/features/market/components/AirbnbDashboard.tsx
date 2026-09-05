'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import { FilterProvider } from '@/features/market/context/FilterContext'
import { FilterBar } from '@/features/market/components/ui/FilterBar'
import { KPICard } from '@/features/market/components/ui/KPICard'
import { ChartContainer } from '@/features/market/components/ui/ChartContainer'
import { PriceHistogram } from '@/features/market/components/charts/PriceHistogram'
import { GeoScatter } from '@/features/market/components/charts/GeoScatter'
import { NeighborhoodBar } from '@/features/market/components/charts/NeighborhoodBar'
import { HostSegmentation } from '@/features/market/components/charts/HostSegmentation'
import { DatasetInfo } from '@/features/market/components/ui/DatasetInfo'

interface Props {
  kpis: {
    total_listings: number
    avg_price_per_night: number
    avg_review_score: number
    median_availability_30: number
    currency: string
    updated: string
  }
  priceDistribution: {
    bins: number[]
    room_types: Record<string, number[]>
  }
  geoHeatmap: {
    points: {
      lat: number
      lon: number
      price: number
      name: string
      room_type: string
      neighbourhood: string
    }[]
  }
  neighborhoodRanking: {
    neighborhoods: {
      name: string
      listing_count: number
      avg_price: number
      avg_rating: number | null
    }[]
  }
  hostSegmentation: {
    segments: {
      name: string
      label: string
      host_count: number
      avg_listings: number
      avg_price: number
      total_listings: number
      sample_hosts: { host_name: string; listing_count: number; avg_price: number }[]
    }[]
  }
}

export function AirbnbDashboard({ kpis, priceDistribution, geoHeatmap, neighborhoodRanking, hostSegmentation }: Props) {
  const tx = useProjectText()
  return (
    <FilterProvider>
      <div className="min-h-screen bg-paper text-ink">

        <main className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Title section */}
          <section className="pt-8 pb-6 border-b border-border">
            <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">{tx("Caso de Estudio 01 — Marzo 2026")}</p>
            <h1 className="font-serif text-3xl md:text-4xl leading-none tracking-tight mb-6">
              {tx('Airbnb — Ciudad de México')}
            </h1>
            <p className="font-sans text-base text-muted max-w-xl leading-relaxed">
              {tx("Inside Airbnb recopila datos públicos de listados de Airbnb en ciudades de todo el mundo. Este dashboard analiza más de 27,000 ofertas activas en la Ciudad de México — precios por noche, concentración por alcaldía y patrones de anfitriones — para entender la dinámica del alojamiento a corto plazo en una de las ciudades más visitadas de América Latina.")}</p>

            <DatasetInfo
              source={{ label: "Inside Airbnb", url: "http://insideairbnb.com/get-the-data" }}
              period={tx("Snapshot de marzo 2025")}
              records={tx("27,051 listados activos con 79 variables cada uno")}
              description={tx("Inside Airbnb es un proyecto independiente que extrae datos públicos de la plataforma Airbnb para hacer transparente el impacto del alquiler a corto plazo en las ciudades. Los datos incluyen precio por noche, ubicación, tipo de alojamiento, calificaciones, disponibilidad y perfil del anfitrión.")}
              limitations={[
                tx("Los precios reflejan el precio publicado, no el precio final pagado (impuestos, limpieza, servicio)"),
                tx("12.9% de listados sin precio registrado"),
                tx("12.6% sin calificaciones (listados nuevos sin reseñas)"),
                tx("Granularidad geográfica: 16 alcaldías (no colonias individuales)"),
              ]}
            />
          </section>

          {/* KPI Bar */}
          <section className="py-12 border-b border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-border">
              <div className="md:pr-8">
                <KPICard label={tx("Ofertas totales")} value={kpis.total_listings} delay={0} />
              </div>
              <div className="md:px-8">
                <KPICard label={tx("Precio promedio / noche")} value={kpis.avg_price_per_night} prefix="MXN " decimals={0} delay={0.1} />
              </div>
              <div className="md:px-8">
                <KPICard label={tx("Calificación promedio")} value={kpis.avg_review_score} decimals={2} suffix=" / 5" delay={0.2} />
              </div>
              <div className="md:pl-8">
                <KPICard label={tx("Disponibilidad mediana")} value={kpis.median_availability_30} suffix={tx(" días/mes")} delay={0.3} />
              </div>
            </div>
          </section>

          {/* Filter bar */}
          <FilterBar />

          {/* Price Distribution */}
          <ChartContainer
            title={tx("Distribución de precios")}
            subtitle={tx("Histograma de precio por noche agrupado por tipo de alojamiento.")}
            insight={tx("La mayoría de las ofertas se concentra entre MXN 500 y 2,000/noche. Los alojamientos completos dominan las bandas de precio medio-alto; los cuartos privados se agrupan cerca del piso de MXN 500.")}
          >
            <PriceHistogram data={priceDistribution} />
          </ChartContainer>

          {/* Geographic Distribution */}
          <ChartContainer
            title={tx("Mapa geográfico")}
            subtitle={tx("Ubicación y precio de ~3,000 ofertas representativas en la CDMX.")}
            insight={tx("Las ofertas se concentran densamente en Cuauhtémoc (Roma, Condesa, Centro) y Miguel Hidalgo (Polanco, Lomas). Las ofertas de mayor precio (puntos ámbar) bordean el extremo poniente.")}
          >
            <GeoScatter data={geoHeatmap} />
          </ChartContainer>

          {/* Neighborhood Ranking */}
          <ChartContainer
            title={tx("Ranking por alcaldía")}
            subtitle={tx("Ofertas, precio promedio y calificación por alcaldía.")}
            insight={tx("Cuauhtémoc concentra el 46% de todas las ofertas, pero Tlalpan y Cuajimalpa muestran los precios promedio más altos con menor volumen — señal de oferta premium en alcaldías periféricas.")}
          >
            <NeighborhoodBar data={neighborhoodRanking} />
          </ChartContainer>

          {/* Host Segmentation */}
          <ChartContainer
            title={tx("Segmentación de anfitriones")}
            subtitle={tx("Clasificación de anfitriones por número de listados: casual, profesional y empresarial.")}
            insight={tx("Los anfitriones empresariales (6+ ofertas) representan solo el 7% de los anfitriones, pero controlan el 40% de la oferta total. Los anfitriones casuales cobran ligeramente más — los empresariales compiten por volumen.")}
          >
            <HostSegmentation data={hostSegmentation} />
          </ChartContainer>
        </main>
      </div>
    </FilterProvider>
  )
}
