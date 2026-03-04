'use client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FilterProvider } from '@/context/FilterContext'
import { FilterBar } from '@/components/ui/FilterBar'
import { KPICard } from '@/components/ui/KPICard'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { PriceHistogram } from '@/components/charts/PriceHistogram'
import { GeoScatter } from '@/components/charts/GeoScatter'
import { NeighborhoodBar } from '@/components/charts/NeighborhoodBar'
import { HostSegmentation } from '@/components/charts/HostSegmentation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DatasetInfo } from '@/components/ui/DatasetInfo'

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
  return (
    <FilterProvider>
      <div className="min-h-screen bg-paper dark:bg-[#141414] text-ink dark:text-[#F0EFEB]">
        {/* Header */}
        <header className="border-b border-border dark:border-[#2a2a2a] px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-muted hover:text-ink dark:hover:text-[#F0EFEB] transition-colors"
          >
            <ArrowLeft size={12} />
            Portafolio
          </Link>
          <ThemeToggle />
        </header>

        <main className="max-w-5xl mx-auto px-6">
          {/* Title section */}
          <section className="pt-16 pb-12 border-b border-border dark:border-[#2a2a2a]">
            <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">Caso de Estudio 01 — Marzo 2026</p>
            <h1 className="font-serif text-5xl md:text-7xl leading-none tracking-tight mb-6">
              Airbnb<br />Ciudad de México
            </h1>
            <p className="font-sans text-base text-muted max-w-xl leading-relaxed">
              Inside Airbnb recopila datos públicos de listados de Airbnb en ciudades de todo el mundo. Este dashboard analiza más de 27,000 ofertas activas en la Ciudad de México — precios por noche, concentración por alcaldía y patrones de anfitriones — para entender la dinámica del alojamiento a corto plazo en una de las ciudades más visitadas de América Latina.
            </p>

            <DatasetInfo
              source={{ label: "Inside Airbnb", url: "http://insideairbnb.com/get-the-data" }}
              period="Snapshot de marzo 2025"
              records="27,051 listados activos con 79 variables cada uno"
              description="Inside Airbnb es un proyecto independiente que extrae datos públicos de la plataforma Airbnb para hacer transparente el impacto del alquiler a corto plazo en las ciudades. Los datos incluyen precio por noche, ubicación, tipo de alojamiento, calificaciones, disponibilidad y perfil del anfitrión."
              limitations={[
                "Los precios reflejan el precio publicado, no el precio final pagado (impuestos, limpieza, servicio)",
                "12.9% de listados sin precio registrado",
                "12.6% sin calificaciones (listados nuevos sin reseñas)",
                "Granularidad geográfica: 16 alcaldías (no colonias individuales)",
              ]}
            />
          </section>

          {/* KPI Bar */}
          <section className="py-12 border-b border-border dark:border-[#2a2a2a]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-border dark:md:divide-[#2a2a2a]">
              <div className="md:pr-8">
                <KPICard label="Ofertas totales" value={kpis.total_listings} delay={0} />
              </div>
              <div className="md:px-8">
                <KPICard label="Precio promedio / noche" value={kpis.avg_price_per_night} prefix="MXN " decimals={0} delay={0.1} />
              </div>
              <div className="md:px-8">
                <KPICard label="Calificación promedio" value={kpis.avg_review_score} decimals={2} suffix=" / 5" delay={0.2} />
              </div>
              <div className="md:pl-8">
                <KPICard label="Disponibilidad mediana" value={kpis.median_availability_30} suffix=" días/mes" delay={0.3} />
              </div>
            </div>
          </section>

          {/* Filter bar */}
          <FilterBar />

          {/* Price Distribution */}
          <ChartContainer
            title="Distribución de precios"
            subtitle="Histograma de precio por noche agrupado por tipo de alojamiento."
            insight="La mayoría de las ofertas se concentra entre MXN 500 y 2,000/noche. Los alojamientos completos dominan las bandas de precio medio-alto; los cuartos privados se agrupan cerca del piso de MXN 500."
          >
            <PriceHistogram data={priceDistribution} />
          </ChartContainer>

          {/* Geographic Distribution */}
          <ChartContainer
            title="Mapa geográfico"
            subtitle="Ubicación y precio de ~3,000 ofertas representativas en la CDMX."
            insight="Las ofertas se concentran densamente en Cuauhtémoc (Roma, Condesa, Centro) y Miguel Hidalgo (Polanco, Lomas). Las ofertas de mayor precio (puntos ámbar) bordean el extremo poniente."
          >
            <GeoScatter data={geoHeatmap} />
          </ChartContainer>

          {/* Neighborhood Ranking */}
          <ChartContainer
            title="Ranking por alcaldía"
            subtitle="Ofertas, precio promedio y calificación por alcaldía."
            insight="Cuauhtémoc concentra el 46% de todas las ofertas, pero Tlalpan y Cuajimalpa muestran los precios promedio más altos con menor volumen — señal de oferta premium en alcaldías periféricas."
          >
            <NeighborhoodBar data={neighborhoodRanking} />
          </ChartContainer>

          {/* Host Segmentation */}
          <ChartContainer
            title="Segmentación de anfitriones"
            subtitle="Clasificación de anfitriones por número de listados: casual, profesional y empresarial."
            insight="Los anfitriones empresariales (6+ ofertas) representan solo el 7% de los anfitriones, pero controlan el 40% de la oferta total. Los anfitriones casuales cobran ligeramente más — los empresariales compiten por volumen."
          >
            <HostSegmentation data={hostSegmentation} />
          </ChartContainer>

          {/* Footer */}
          <footer className="py-10 border-t border-border dark:border-[#2a2a2a] mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-sans text-xs text-muted">
                Datos:{' '}
                <a
                  href="http://insideairbnb.com/get-the-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-ink dark:hover:text-[#F0EFEB] transition-colors"
                >
                  Inside Airbnb
                </a>
                {' '}— CDMX, marzo 2026
              </p>
              <p className="font-sans text-xs text-muted">Updated {kpis.updated}</p>
            </div>
            <Link
              href="/"
              className="font-sans text-xs tracking-widest uppercase text-muted hover:text-ink dark:hover:text-[#F0EFEB] transition-colors"
            >
              Volver al portafolio
            </Link>
          </footer>
        </main>
      </div>
    </FilterProvider>
  )
}
