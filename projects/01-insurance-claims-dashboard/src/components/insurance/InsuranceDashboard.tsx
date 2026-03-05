'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InsuranceFilterProvider, useInsuranceFilter } from '@/context/InsuranceFilterContext'
import { InsuranceFilterBar } from '@/components/insurance/InsuranceFilterBar'
import { LossTriangleHeatmap } from '@/components/insurance/LossTriangleHeatmap'
import { IBNRWaterfall } from '@/components/insurance/IBNRWaterfall'
import { FrequencySeverityChart } from '@/components/insurance/FrequencySeverityChart'
import { LossRatioByLOB } from '@/components/insurance/LossRatioByLOB'
import { CombinedRatioTrend } from '@/components/insurance/CombinedRatioTrend'
import { ClaimDistribution } from '@/components/insurance/ClaimDistribution'
import { ColdStartBanner } from '@/components/insurance/ColdStartBanner'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { KPICard } from '@/components/ui/KPICard'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DatasetInfo } from '@/components/ui/DatasetInfo'
import { CLvsBFTable } from '@/components/insurance/CLvsBFTable'
import {
  useInsuranceKPIs,
  useLossTriangle,
  useCLvsBF,
  useFrequencySeverity,
  useLossRatios,
  useCombinedRatio,
  useClaimDistribution,
} from '@/hooks/useInsuranceAPI'

interface KPIData {
  total_premium: number
  avg_loss_ratio: number
  total_ibnr_cl_paid: number
  total_incurred: number
  total_paid: number
  total_claims: number
  open_claims: number
  avg_severity: number
  avg_report_lag_days: number
  total_ibnr_bf: number
}

function lossRatioColor(ratio: number): string {
  if (ratio < 0.7) return 'var(--ratio-profitable)'
  if (ratio < 1.0) return 'var(--ratio-breakeven)'
  return 'var(--ratio-loss)'
}

function combinedRatioColor(ratio: number): string {
  if (ratio < 1.0) return 'var(--ratio-profitable)'
  return 'var(--ratio-loss)'
}

function InsuranceDashboardInner() {
  const filters = useInsuranceFilter()
  const filterValues = {
    lob: filters.lob,
    company: filters.company,
    yearStart: filters.yearStart,
    yearEnd: filters.yearEnd,
  }

  const [triangleBasis, setTriangleBasis] = useState<'incurred' | 'paid'>('incurred')
  const [reserveMethod, setReserveMethod] = useState<'cl' | 'bf'>('cl')

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useInsuranceKPIs(filterValues)
  const { data: triangleData, isLoading: triangleLoading, error: triangleError } = useLossTriangle(filterValues, triangleBasis, reserveMethod)
  const { data: clvsbfData, isLoading: clvsbfLoading } = useCLvsBF(filterValues, triangleBasis)
  const { data: freqSevData, isLoading: freqSevLoading, error: freqSevError } = useFrequencySeverity(filterValues)
  const { data: lossRatioData, isLoading: lossRatioLoading, error: lossRatioError } = useLossRatios(filterValues)
  const { data: combinedData, isLoading: combinedLoading, error: combinedError } = useCombinedRatio(filterValues)
  const { data: claimDistData, isLoading: claimDistLoading, error: claimDistError } = useClaimDistribution(filterValues)

  const anyLoading = kpisLoading || triangleLoading || freqSevLoading || lossRatioLoading || combinedLoading || claimDistLoading
  const anyError = !!(kpisError || triangleError || freqSevError || lossRatioError || combinedError || claimDistError)
  const allLoaded = !!(kpis && triangleData && freqSevData && lossRatioData && combinedData && claimDistData)

  const kpiData = kpis as KPIData | undefined

  return (
    <div className="min-h-screen bg-paper dark:bg-[#141414] text-ink dark:text-[#F0EFEB]">
      <ColdStartBanner anyLoading={anyLoading} anyError={anyError} allLoaded={allLoaded} />

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
          <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">Caso de Estudio 01 -- Marzo 2026</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-none tracking-tight mb-6">
            Reservas y<br />Siniestralidad
          </h1>
          <p className="font-sans text-base text-muted max-w-xl leading-relaxed">
            Triángulos de desarrollo, estimación IBNR y ratios combinados para líneas de negocio de seguros.
            Datos del Casualty Actuarial Society (CAS) y NAIC -- 1988 a 1997.
          </p>

          <DatasetInfo
            source={{ label: "CAS Loss Reserve Database", url: "https://www.casact.org/publications-research/research/research-resources/loss-reserving-data-pulled-naic-schedule-p" }}
            period="Años de accidente 1988 a 1997 (10 años de desarrollo)"
            records="Triángulos de desarrollo para 6 líneas de negocio de múltiples aseguradoras"
            description="La base de datos de reservas del Casualty Actuarial Society (CAS) contiene triángulos de desarrollo extraídos del Schedule P del NAIC. Incluye pérdidas incurridas, pérdidas pagadas, primas devengadas y conteo de siniestros para líneas de negocio como Auto Personal, Workers Comp, Medical Malpractice, Responsabilidad Civil, Responsabilidad de Producto y Auto Comercial."
            limitations={[
              "Datos agregados por línea de negocio y compañía (no siniestros individuales)",
              "Solo incluye aseguradoras que reportan al NAIC (excluye reaseguradoras y cautivas)",
              "El período 1988-1997 puede no reflejar tendencias actuales del mercado",
              "Los triángulos asumen desarrollo uniforme dentro de cada lag anual",
            ]}
          />
        </section>

        {/* Como leer este dashboard */}
        <section className="py-6 border-b border-border dark:border-[#2a2a2a]">
          <details>
            <summary className="font-sans text-xs tracking-widest uppercase text-muted cursor-pointer">
              Como leer este dashboard
            </summary>
            <div className="font-sans text-sm text-muted mt-4 space-y-4">
              <div>
                <p className="font-semibold mb-1">Secciones del dashboard</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Triangulo de desarrollo</strong> -- Matriz de perdidas acumuladas por ano de accidente (filas) y lag de desarrollo (columnas). El heatmap muestra la magnitud; las celdas proyectadas incluyen la anotacion de IBNR.</li>
                  <li><strong>Waterfall de IBNR</strong> -- Descompone el ultimate en tres componentes: perdidas pagadas + reserva de caso + IBNR = ultimate proyectado.</li>
                  <li><strong>Frecuencia y severidad</strong> -- Grafico de doble eje que muestra conteo de siniestros (frecuencia) y costo promedio por siniestro (severidad) por ano de accidente.</li>
                  <li><strong>Loss ratio por LOB</strong> -- Ratio de perdidas incurridas sobre prima devengada para cada linea de negocio, con toggle entre reportado y ultimate.</li>
                  <li><strong>Combined ratio</strong> -- Tendencia del ratio combinado (loss ratio + expense ratio) como area apilada. Debajo de 100% indica rentabilidad.</li>
                  <li><strong>Distribucion de severidad</strong> -- Histograma de montos de siniestros individuales y analisis de rezago de reporte.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Filtros</p>
                <p>Usa los filtros de <strong>linea de negocio (LOB)</strong>, <strong>compania</strong> y <strong>rango de anos de accidente</strong> para segmentar el analisis. Los KPIs y graficos se actualizan dinamicamente.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Definiciones clave</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Loss Ratio</strong> = Perdidas Incurridas / Prima Devengada. Debajo de 100% indica suscripcion rentable.</li>
                  <li><strong>Combined Ratio</strong> = Loss Ratio + Expense Ratio. Debajo de 100% indica rentabilidad operativa total.</li>
                  <li><strong>IBNR</strong> = Incurred But Not Reported. Reserva para siniestros que ya ocurrieron pero aun no se han reportado o desarrollado completamente.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Chain-Ladder vs Bornhuetter-Ferguson</p>
                <p><strong>Chain-Ladder (CL)</strong> proyecta perdidas ultimates multiplicando los valores observados por factores de desarrollo historicos. Es puramente basado en datos.</p>
                <p><strong>Bornhuetter-Ferguson (BF)</strong> modera la proyeccion combinando los factores de desarrollo con un loss ratio a-priori esperado. Es mas estable para anos de accidente recientes donde hay pocos datos observados.</p>
              </div>
            </div>
          </details>
        </section>

        {/* KPI Bar */}
        <section className="py-12 border-b border-border dark:border-[#2a2a2a]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-border dark:md:divide-[#2a2a2a]">
            <div className="md:pr-8">
              <KPICard
                label="Prima neta devengada"
                value={kpiData?.total_premium ?? 0}
                prefix="$"
                delay={0}
              />
            </div>
            <div className="md:px-8">
              <KPICard
                label="Loss ratio"
                value={(kpiData?.avg_loss_ratio ?? 0) * 100}
                suffix="%"
                decimals={1}
                delay={0.1}
                valueColor={kpiData ? lossRatioColor(kpiData.avg_loss_ratio) : undefined}
              />
            </div>
            <div className="md:px-8">
              <KPICard
                label="Combined ratio"
                value={((kpiData?.avg_loss_ratio ?? 0) + 0.30) * 100}
                suffix="%"
                decimals={1}
                delay={0.2}
                valueColor={kpiData ? combinedRatioColor(kpiData.avg_loss_ratio + 0.30) : undefined}
              />
            </div>
            <div className="md:pl-8">
              <KPICard
                label={`IBNR (${reserveMethod.toUpperCase()})`}
                value={reserveMethod === 'cl' ? (kpiData?.total_ibnr_cl_paid ?? 0) : (kpiData?.total_ibnr_bf ?? 0)}
                prefix="$"
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <InsuranceFilterBar />

        {/* Loss Triangle Heatmap */}
        <ChartContainer
          title="Triángulo de desarrollo"
          subtitle="Pérdidas acumuladas por año de accidente y período de desarrollo. IBNR estimado por diferencia entre último desarrollo observado y factor ultimate."
          insight="Los años de accidente más recientes muestran mayor incertidumbre en sus estimaciones IBNR debido a menos períodos de desarrollo observados. Los años más maduros (1988-1990) están prácticamente desarrollados al 100%."
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LossTriangleHeatmap data={triangleData as any} isLoading={triangleLoading} viewMode={triangleBasis} onViewModeChange={setTriangleBasis} reserveMethod={reserveMethod} onReserveMethodChange={setReserveMethod} />
        </ChartContainer>

        {/* CL vs BF Comparison Table */}
        <ChartContainer
          title="Chain-Ladder vs Bornhuetter-Ferguson"
          subtitle="Comparación de estimaciones IBNR por año de accidente entre ambos métodos actuariales."
          insight="BF tiende a moderar las estimaciones en años recientes donde CL puede ser volátil por falta de datos observados. Diferencias grandes sugieren que la elección de método impacta materialmente la reserva."
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <CLvsBFTable data={clvsbfData as any} isLoading={clvsbfLoading} />
        </ChartContainer>

        {/* IBNR Waterfall */}
        <ChartContainer
          title="Composición del ultimate"
          subtitle="Descomposición de la pérdida última por año de accidente: observado + IBNR = Ultimate."
          insight="La proporción de IBNR aumenta significativamente en los años de accidente recientes, reflejando la mayor incertidumbre inherente a siniestros aún no reportados. En años maduros, el componente IBNR es mínimo."
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <IBNRWaterfall data={triangleData as any} isLoading={triangleLoading} />
        </ChartContainer>

        {/* Frequency-Severity Chart */}
        <ChartContainer
          title="Frecuencia y severidad"
          subtitle="Tendencia de frecuencia de siniestros (# siniestros / exposicion) y severidad promedio (costo promedio por siniestro) a lo largo del tiempo."
          insight="Una frecuencia decreciente con severidad creciente sugiere que hay menos siniestros pero de mayor costo unitario -- un patrón común en líneas de responsabilidad civil donde las demandas son menos frecuentes pero los montos de liquidación aumentan con la inflación judicial."
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <FrequencySeverityChart data={freqSevData as any} isLoading={freqSevLoading} />
        </ChartContainer>

        {/* Loss Ratio by LOB */}
        <ChartContainer
          title="Loss ratio por línea de negocio"
          subtitle="Ratio de pérdida (pérdidas incurridas / primas devengadas) promedio por línea de negocio. La línea de referencia en 100% marca el punto de equilibrio técnico."
          insight="Medical Malpractice y Product Liability consistentemente muestran los loss ratios más altos, reflejando la naturaleza long-tail de estas líneas donde el desarrollo de siniestros se extiende por múltiples años."
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LossRatioByLOB data={lossRatioData as any} isLoading={lossRatioLoading} />
        </ChartContainer>

        {/* Combined Ratio Trend */}
        <ChartContainer
          title="Tendencia del combined ratio"
          subtitle="Loss ratio + expense ratio = combined ratio. Por debajo de 100% indica rentabilidad técnica; por encima indica pérdida técnica."
          insight="El combined ratio fluctúa alrededor del 100%, indicando que la industria opera cerca del punto de equilibrio técnico. Los años con combined ratio superior al 100% dependen de ingresos de inversión para ser rentables."
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <CombinedRatioTrend data={combinedData as any} isLoading={combinedLoading} />
        </ChartContainer>

        {/* Claim Distribution */}
        <ChartContainer
          title="Distribución de severidad"
          subtitle="Histograma de la severidad de siniestros (escala logarítmica) y resumen del rezago de reporte por línea de negocio."
          insight="La distribución de severidad es fuertemente sesgada a la derecha -- la mayoría de los siniestros son de bajo monto, pero una cola larga de siniestros catastróficos concentra una proporción desproporcionada de las pérdidas totales."
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ClaimDistribution data={claimDistData as any} isLoading={claimDistLoading} />
        </ChartContainer>

        {/* Footer */}
        <footer className="py-10 border-t border-border dark:border-[#2a2a2a] mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-sans text-xs text-muted">
              Datos:{' '}
              <a
                href="https://www.casact.org/publications-research/research/research-resources/loss-reserving-data-pulled-naic-schedule-p"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink dark:hover:text-[#F0EFEB] transition-colors"
              >
                CAS Loss Reserve Database
              </a>
              {' '}-- NAIC Schedule P, 1988--1997
            </p>
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
  )
}

export function InsuranceDashboard() {
  return (
    <InsuranceFilterProvider>
      <InsuranceDashboardInner />
    </InsuranceFilterProvider>
  )
}
