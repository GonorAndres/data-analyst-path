import { readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import { AirbnbDashboard } from '@/components/AirbnbDashboard'

export const metadata: Metadata = {
  title: 'Airbnb CDMX — Andrés González Ortega',
  description: 'Dinámica de precios, segmentación de anfitriones y demanda por alcaldía en 27,000+ ofertas de Airbnb en Ciudad de México.',
}

function readJson<T>(filename: string): T {
  const filePath = join(process.cwd(), 'public', 'data', 'airbnb', filename)
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T
}

export default function AirbnbPage() {
  const kpis = readJson<{
    total_listings: number
    avg_price_per_night: number
    avg_review_score: number
    median_availability_30: number
    currency: string
    updated: string
  }>('kpis.json')

  const priceDistribution = readJson<{
    bins: number[]
    room_types: Record<string, number[]>
  }>('price_distribution.json')

  const geoHeatmap = readJson<{
    points: {
      lat: number
      lon: number
      price: number
      name: string
      room_type: string
      neighbourhood: string
    }[]
  }>('geo_heatmap.json')

  const neighborhoodRanking = readJson<{
    neighborhoods: {
      name: string
      listing_count: number
      avg_price: number
      avg_rating: number | null
    }[]
  }>('neighborhood_ranking.json')

  const hostSegmentation = readJson<{
    segments: {
      name: string
      label: string
      host_count: number
      avg_listings: number
      avg_price: number
      total_listings: number
      sample_hosts: { host_name: string; listing_count: number; avg_price: number }[]
    }[]
  }>('host_segmentation.json')

  return (
    <AirbnbDashboard
      kpis={kpis}
      priceDistribution={priceDistribution}
      geoHeatmap={geoHeatmap}
      neighborhoodRanking={neighborhoodRanking}
      hostSegmentation={hostSegmentation}
    />
  )
}
