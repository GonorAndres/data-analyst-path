'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import { hasSeries } from '@/features/market/components/hasSeries'
import { useState } from 'react'
import { usePreferences } from '@/components/SitePreferences'
import { InsuranceFilterProvider, useInsuranceFilter } from '@/features/insurance/context/InsuranceFilterContext'
import { InsuranceFilterBar } from '@/features/insurance/components/insurance/InsuranceFilterBar'
import { LossTriangleHeatmap } from '@/features/insurance/components/insurance/LossTriangleHeatmap'
import { IBNRWaterfall } from '@/features/insurance/components/insurance/IBNRWaterfall'
import { FrequencySeverityChart } from '@/features/insurance/components/insurance/FrequencySeverityChart'
import { LossRatioByLOB } from '@/features/insurance/components/insurance/LossRatioByLOB'
import { CombinedRatioTrend } from '@/features/insurance/components/insurance/CombinedRatioTrend'
import { ClaimDistribution } from '@/features/insurance/components/insurance/ClaimDistribution'
import { ColdStartBanner } from '@/features/insurance/components/insurance/ColdStartBanner'
import { ChartContainer } from '@/features/insurance/components/ui/ChartContainer'
import { KPICard } from '@/features/insurance/components/ui/KPICard'
import { DatasetInfo } from '@/features/insurance/components/ui/DatasetInfo'
import { CLvsBFTable } from '@/features/insurance/components/insurance/CLvsBFTable'
import {
  useInsuranceKPIs,
  useLossTriangle,
  useCLvsBF,
  useFrequencySeverity,
  useLossRatios,
  useCombinedRatio,
  useClaimDistribution,
} from '@/features/insurance/hooks/useInsuranceAPI'

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
  const tx = useProjectText()
  const { t } = usePreferences()
  const filters = useInsuranceFilter()
  const filterValues = {
    lob: filters.lob,
    company: filters.company,
    yearStart: filters.yearStart,
    yearEnd: filters.yearEnd,
  }

  const [triangleBasis, setTriangleBasis] = useState<'incurred' | 'paid'>('incurred')
  const [selectedMethod, setReserveMethod] = useState<'cl' | 'bf'>('cl')
  const reserveMethod = filters.company ? 'cl' : selectedMethod

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useInsuranceKPIs(filterValues)
  const { data: triangleData, isLoading: triangleLoading, error: triangleError } = useLossTriangle(filterValues, triangleBasis, reserveMethod)
  const { data: clvsbfData, isLoading: clvsbfLoading, error: clvsbfError } = useCLvsBF(filterValues, triangleBasis)
  const { data: freqSevData, isLoading: freqSevLoading, error: freqSevError } = useFrequencySeverity(filterValues)
  const { data: lossRatioData, isLoading: lossRatioLoading, error: lossRatioError } = useLossRatios(filterValues)
  const { data: combinedData, isLoading: combinedLoading, error: combinedError } = useCombinedRatio(filterValues)
  const { data: claimDistData, isLoading: claimDistLoading, error: claimDistError } = useClaimDistribution(filterValues)

  const anyLoading = kpisLoading || triangleLoading || clvsbfLoading || freqSevLoading || lossRatioLoading || combinedLoading || claimDistLoading
  const anyError = !!(kpisError || triangleError || (!filters.company && clvsbfError) || freqSevError || lossRatioError || combinedError || claimDistError)
  const allLoaded = !!(kpis && triangleData && freqSevData && lossRatioData && combinedData && claimDistData)

  const kpiData = kpis as KPIData | undefined
  const reserveRows = (triangleData as { ibnr_by_year?: { ultimate: number | null; latest_value: number | null }[] } | undefined)?.ibnr_by_year
  const reserveTotal = !triangleError && !triangleLoading && reserveRows?.length && reserveRows.every(row => row.ultimate != null && row.latest_value != null)
    ? reserveRows.reduce((sum, row) => sum + row.ultimate! - row.latest_value!, 0)
    : undefined
  const reserveLabel = triangleBasis === 'paid' ? t('Projected unpaid', 'Pendiente proyectado') : t('IBNR estimate', 'IBNR estimado')

  return (
    <div className="min-h-screen bg-paper text-ink">
      <ColdStartBanner anyLoading={anyLoading} anyError={anyError} allLoaded={allLoaded} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Title section */}
        <section className="pt-8 pb-6 border-b border-border">
          <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">{tx("Caso de Estudio 01 -- Marzo 2026")}</p>
          <h1 className="font-serif text-3xl md:text-4xl leading-none tracking-tight mb-6">
            {tx('Reservas y siniestralidad')}
          </h1>
          <p className="font-sans text-base text-muted max-w-xl leading-relaxed">
            {tx("Triángulos de desarrollo, estimación IBNR y ratios combinados para líneas de negocio de seguros. Datos del Casualty Actuarial Society (CAS) y NAIC -- 1988 a 1997.")}</p>

          <DatasetInfo
            source={{ label: "CAS Loss Reserve Database", url: "https://www.casact.org/publications-research/research/research-resources/loss-reserving-data-pulled-naic-schedule-p" }}
            period={tx("Años de accidente 1988 a 1997 (10 años de desarrollo)")}
            records={tx("Triángulos de desarrollo para 6 líneas de negocio de múltiples aseguradoras")}
            description={tx("La base de datos de reservas del Casualty Actuarial Society (CAS) contiene triángulos de desarrollo extraídos del Schedule P del NAIC. Incluye pérdidas incurridas, pérdidas pagadas, primas devengadas y conteo de siniestros para líneas de negocio como Auto Personal, Workers Comp, Medical Malpractice, Responsabilidad Civil, Responsabilidad de Producto y Auto Comercial.")}
            limitations={[
              tx("Datos agregados por línea de negocio y compañía (no siniestros individuales)"),
              tx("Solo incluye aseguradoras que reportan al NAIC (excluye reaseguradoras y cautivas)"),
              tx("El período 1988-1997 puede no reflejar tendencias actuales del mercado"),
              tx("Los triángulos asumen desarrollo uniforme dentro de cada lag anual"),
            ]}
          />
        </section>

        <section className="py-6 border-b border-border space-y-3 text-sm text-muted">
          <p>{t('Observed evidence: Schedule P development triangles. Claim counts, severity and reporting lags below use synthetic claims; their company filter does not apply.', 'Evidencia observada: triángulos Schedule P. Conteos, severidad y rezagos usan siniestros sintéticos; el filtro de compañía no se aplica a ellos.')}</p>
          <p>{t('Paid ultimate minus observed paid is projected unpaid loss, including case reserves. Incurred ultimate minus reported incurred is estimated IBNR. A loss ratio below 100% alone does not establish underwriting profitability; combined ratios add assumed expenses of 30%.', 'Ultimate pagado menos pagado observado es pérdida pendiente proyectada, incluidas reservas de caso. Ultimate incurrido menos incurrido reportado es IBNR estimado. Un loss ratio menor al 100% no basta para demostrar rentabilidad; el ratio combinado suma gastos supuestos del 30%.')}</p>
          <p>{t('Bornhuetter–Ferguson ultimates use paid development and an assumed 65% expected loss ratio. Their difference from Chain-Ladder measures method sensitivity, not a confidence interval. BF and method comparisons are available only across companies.', 'Los ultimates Bornhuetter–Ferguson usan desarrollo pagado y un loss ratio esperado supuesto del 65%. Su diferencia frente a Chain-Ladder mide sensibilidad al método, no un intervalo de confianza. BF y la comparación de métodos solo están disponibles entre todas las compañías.')}</p>
        </section>

        {/* KPI Bar */}
        <section className="py-12 border-b border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-border">
            <div className="md:pr-8">
              <KPICard
                label={tx("Prima neta devengada")}
                value={kpisError || kpisLoading ? undefined : kpiData?.total_premium}
                prefix="$"
                delay={0}
              />
            </div>
            <div className="md:px-8">
              <KPICard
                label="Loss ratio"
                value={!kpisError && !kpisLoading && kpiData ? kpiData.avg_loss_ratio * 100 : undefined}
                suffix="%"
                decimals={1}
                delay={0.1}
                valueColor={kpiData ? lossRatioColor(kpiData.avg_loss_ratio) : undefined}
              />
            </div>
            <div className="md:px-8">
              <KPICard
                label={t('Combined ratio · assumes 30% expenses', 'Ratio combinado · gastos supuestos del 30%')}
                value={!kpisError && !kpisLoading && kpiData ? (kpiData.avg_loss_ratio + 0.30) * 100 : undefined}
                suffix="%"
                decimals={1}
                delay={0.2}
                valueColor={kpiData ? combinedRatioColor(kpiData.avg_loss_ratio + 0.30) : undefined}
              />
            </div>
            <div className="md:pl-8">
              <KPICard
                label={`${reserveLabel} (${reserveMethod.toUpperCase()} · ${triangleBasis === 'paid' ? t('paid', 'pagado') : t('incurred', 'incurrido')})`}
                value={reserveTotal}
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
          title={tx("Triángulo de desarrollo")}
          loading={triangleLoading} error={triangleError} empty={!hasSeries(triangleData, 'accident_years')}
          subtitle={t("Cumulative observed losses by accident year and development lag. The final column is projected ultimate minus the latest observed value.", "Pérdidas acumuladas por año y lag. La columna final es ultimate proyectado menos el último valor observado.")}
          insight={t("Follow one row across development, then compare its observed value with the selected method’s ultimate. Less observed development means greater dependence on assumptions.", "Sigue una fila a través del desarrollo y compara lo observado con el ultimate del método elegido. Menos desarrollo observado implica mayor dependencia de supuestos.")}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LossTriangleHeatmap data={triangleData as any} isLoading={triangleLoading} viewMode={triangleBasis} onViewModeChange={setTriangleBasis} reserveMethod={reserveMethod} onReserveMethodChange={setReserveMethod} bfAvailable={!filters.company} />
        </ChartContainer>

        {/* CL vs BF Comparison Table */}
        <ChartContainer
          title="Chain-Ladder vs Bornhuetter-Ferguson"
          loading={!filters.company && clvsbfLoading} error={!filters.company && clvsbfError} empty={!filters.company && !hasSeries(clvsbfData, 'comparison')}
          subtitle={t("Precomputed estimates summed across selected lines; the triangle above instead fits CL to pooled observations. Compare residual losses on a common observed basis. BF ultimates use paid development.", "Estimaciones precalculadas sumadas por líneas; el triángulo anterior ajusta CL a observaciones agrupadas. Compara residuales con la misma base observada. BF usa desarrollo pagado.")}
          insight={t("Read the difference as sensitivity to method and assumptions. Either estimate may be higher; neither proves reserve adequacy.", "Lee la diferencia como sensibilidad al método y sus supuestos. Cualquiera puede ser mayor; ninguno demuestra suficiencia de reservas.")}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {filters.company ? <p className="text-sm text-muted">{t('Select all companies to compare methods. Company-specific BF estimates are unavailable.', 'Selecciona todas las compañías para comparar métodos. No hay estimaciones BF por compañía.')}</p> : <CLvsBFTable data={clvsbfData as any} isLoading={clvsbfLoading} basis={triangleBasis} />}
        </ChartContainer>

        {/* IBNR Waterfall */}
        <ChartContainer
          title={tx("Composición del ultimate")}
          loading={triangleLoading} error={triangleError} empty={!hasSeries(triangleData, 'ibnr_by_year')}
          subtitle={t("Observed loss plus projected residual equals ultimate. On the paid basis, the residual includes case reserves.", "Pérdida observada más residual proyectado igual a ultimate. En base pagada, el residual incluye reservas de caso.")}
          insight={t("Compare the observed and projected portions for the selected years. A negative residual indicates projected release; the chart does not quantify uncertainty.", "Compara lo observado y proyectado en los años elegidos. Un residual negativo indica liberación proyectada; el gráfico no cuantifica incertidumbre.")}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <IBNRWaterfall data={triangleData as any} isLoading={triangleLoading} basis={triangleBasis} />
        </ChartContainer>

        {/* Frequency-Severity Chart */}
        <ChartContainer
          title={tx("Frecuencia y severidad")}
          loading={freqSevLoading} error={freqSevError} empty={!hasSeries(freqSevData, 'by_year')}
          subtitle={t("Synthetic claims · claim count and average claim cost by year. Counts are not exposure-adjusted frequency. Company selection does not apply.", "Siniestros sintéticos · conteo y costo medio por año. El conteo no es frecuencia ajustada por exposición. No se aplica el filtro de compañía.")}
          insight={t("Compare count and average cost separately. These generated patterns explain the measures, not observed inflation or policyholder behavior.", "Compara conteo y costo medio por separado. Estos patrones generados explican medidas, no inflación observada ni conducta de asegurados.")}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <FrequencySeverityChart data={freqSevData as any} isLoading={freqSevLoading} />
        </ChartContainer>

        {/* Loss Ratio by LOB */}
        <ChartContainer
          title={tx("Loss ratio por línea de negocio")}
          loading={lossRatioLoading} error={lossRatioError} empty={!hasSeries(lossRatioData, 'by_lob')}
          subtitle={t("Incurred losses divided by earned premium. The 100% reference covers losses only; expenses are excluded.", "Pérdidas incurridas entre prima devengada. La referencia del 100% cubre solo pérdidas; excluye gastos.")}
          insight={t("Compare reported and projected loss ratios for the selected population. Investigate development and company mix before interpreting a ranking.", "Compara ratios reportados y proyectados de la población elegida. Investiga desarrollo y mezcla de compañías antes de interpretar el ranking.")}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LossRatioByLOB data={lossRatioData as any} isLoading={lossRatioLoading} />
        </ChartContainer>

        {/* Combined Ratio Trend */}
        <ChartContainer
          title={tx("Tendencia del combined ratio")}
          loading={combinedLoading} error={combinedError} empty={!hasSeries(combinedData, 'by_year')}
          subtitle={t("Combined ratio = loss ratio + assumed 30% expenses. Below 100% indicates underwriting profit under this expense assumption.", "Ratio combinado = loss ratio + gastos supuestos del 30%. Menos del 100% indica beneficio de suscripción bajo ese supuesto.")}
          insight={t("Check which selected years cross 100% and test another expense assumption before drawing profitability conclusions.", "Revisa qué años elegidos cruzan el 100% y prueba otro supuesto de gastos antes de concluir rentabilidad.")}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <CombinedRatioTrend data={combinedData as any} isLoading={combinedLoading} />
        </ChartContainer>

        {/* Claim Distribution */}
        <ChartContainer
          title={tx("Distribución de severidad")}
          loading={claimDistLoading} error={claimDistError} empty={!hasSeries(claimDistData, 'severity_histogram')}
          subtitle={t("Synthetic claims · severity distribution and reporting lag by line of business. Company selection does not apply.", "Siniestros sintéticos · distribución de severidad y rezago por línea. No se aplica el filtro de compañía.")}
          insight={t("Inspect the distribution’s tail and compare reporting lags. These features follow generation assumptions and are not observed company claims.", "Examina la cola y compara rezagos. Estas características siguen supuestos de generación; no son siniestros observados de compañías.")}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ClaimDistribution data={claimDistData as any} isLoading={claimDistLoading} />
        </ChartContainer>
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
