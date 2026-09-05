'use client'
import { useState } from 'react'
import { usePreferences } from '@/components/SitePreferences'
import { SectionNav } from '@/components/SectionNav'
import { motion } from 'framer-motion'
import { useLanguage } from '@/features/kpi/context/LanguageContext'

interface NotebookMeta {
  id: string
  file: string
  title_en: string
  title_es: string
  description_en: string
  description_es: string
  inputs: string
  outputs: string
}

const NOTEBOOKS: NotebookMeta[] = [
  {
    id: 'data-gen',
    file: '01_data_generation.html',
    title_en: 'Data Generation',
    title_es: 'Generación de Datos',
    description_en: 'Creates the synthetic NovaCRM dataset with realistic SaaS patterns: customer segments, MRR movements, churn events, NPS responses, and seasonal effects over 24 months.',
    description_es: 'Crea el dataset sintético de NovaCRM con patrones realistas de SaaS: segmentos de clientes, movimientos de MRR, eventos de churn, respuestas de NPS y efectos estacionales durante 24 meses.',
    inputs: 'Configuration parameters (segments, base MRR, churn rates)',
    outputs: 'data/processed/novacr_monthly.parquet',
  },
  {
    id: 'eda',
    file: '02_eda_saas_metrics.html',
    title_en: 'Exploratory Data Analysis',
    title_es: 'Análisis Exploratorio de Datos',
    description_en: 'Validates the generated data, checks distributions, correlations between KPIs, and identifies baseline patterns. Produces summary statistics and initial visualizations.',
    description_es: 'Valida los datos generados, verifica distribuciones, correlaciones entre KPIs e identifica patrones base. Produce estadísticas resumen y visualizaciones iniciales.',
    inputs: 'data/processed/novacr_monthly.parquet',
    outputs: 'Summary statistics, correlation matrices, trend plots',
  },
  {
    id: 'anomaly',
    file: '03_anomaly_detection.html',
    title_en: 'Anomaly Detection',
    title_es: 'Detección de Anomalías',
    description_en: 'Applies z-score analysis on deseasonalized residuals to flag unusual KPI values. Classifies anomalies by severity (critical, warning, info) and generates descriptions.',
    description_es: 'Aplica análisis de z-score sobre residuos desestacionalizados para marcar valores inusuales de KPIs. Clasifica anomalías por severidad (crítico, advertencia, informativo) y genera descripciones.',
    inputs: 'data/processed/novacr_monthly.parquet',
    outputs: 'data/processed/anomalies.parquet',
  },
  {
    id: 'forecast',
    file: '04_forecasting.html',
    title_en: 'Forecasting',
    title_es: 'Pronósticos',
    description_en: 'Builds exponential smoothing models for MRR, churn, and NPS. Generates 3-month forecasts with 80% confidence intervals. Evaluates accuracy against held-out data.',
    description_es: 'Construye modelos de suavizamiento exponencial para MRR, churn y NPS. Genera pronósticos a 3 meses con intervalos de confianza del 80%. Evalua precisión contra datos de validación.',
    inputs: 'data/processed/novacr_monthly.parquet',
    outputs: 'data/processed/forecasts.parquet',
  },
  {
    id: 'report',
    file: '05_report_automation.html',
    title_en: 'Report Automation',
    title_es: 'Automatización del Reporte',
    description_en: 'Orchestrates the full report pipeline: loads all processed data, computes health score, generates executive commentary, creates charts, and exports to PDF.',
    description_es: 'Orquesta el pipeline completo del reporte: carga todos los datos procesados, calcula el puntaje de salud, genera comentario ejecutivo, crea gráficos y exporta a PDF.',
    inputs: 'All processed parquets + Jinja2 templates',
    outputs: 'reports/executive_kpi_report.pdf',
  },
  {
    id: 'backend-arch',
    file: '06_backend_architecture.html',
    title_en: 'Backend Architecture',
    title_es: 'Arquitectura del Backend',
    description_en: 'FastAPI app structure, CORS config, router mounting, and data loader design decisions.',
    description_es: 'Estructura de la app FastAPI, configuración CORS, montaje de routers y decisiones de diseño del data loader.',
    inputs: 'backend/kpi_backend/main.py, data_loader.py',
    outputs: 'Running FastAPI service on :8052',
  },
  {
    id: 'kpi-calc',
    file: '07_kpi_calculations.html',
    title_en: 'KPI Calculations',
    title_es: 'Cálculo de KPIs',
    description_en: 'Formulas for all 12 KPIs, traffic light thresholds, and health score weighting logic.',
    description_es: 'Formulas para los 12 KPIs, umbrales del semáforo y lógica de ponderacion del puntaje de salud.',
    inputs: 'data/processed/novacr_monthly.parquet',
    outputs: 'KPI values, traffic lights, health score (0-100)',
  },
  {
    id: 'analytics-alg',
    file: '08_analytics_algorithms.html',
    title_en: 'Analytics Algorithms',
    title_es: 'Algoritmos de Análisis',
    description_en: 'Dual anomaly detection (z-score + IQR), severity classification, and Holt-Winters forecasting parameters.',
    description_es: 'Detección dual de anomalías (z-score + IQR), clasificacion de severidad y parámetros del pronóstico Holt-Winters.',
    inputs: 'data/processed/novacr_monthly.parquet',
    outputs: 'anomalies.parquet, forecasts.parquet',
  },
  {
    id: 'pdf-pipeline',
    file: '09_pdf_report_pipeline.html',
    title_en: 'PDF Report Pipeline',
    title_es: 'Pipeline del Reporte PDF',
    description_en: 'PDF layout, chart rendering, bilingual commentary templates, and a downloadable PDF response.',
    description_es: 'Diseño del PDF, gráficos, plantillas de comentarios bilingües y respuesta PDF descargable.',
    inputs: 'All processed parquets + report config from frontend',
    outputs: 'PDF document (application/pdf)',
  },
]

export function TechnicalProcess() {
  const { t: text } = usePreferences()
  const [activeNotebook, setActiveNotebook] = useState(NOTEBOOKS[0].id)
  const { language, t } = useLanguage()

  const active = NOTEBOOKS.find((n) => n.id === activeNotebook)!
  const descriptions: Record<string, string> = {
    'Configuration parameters (segments, base MRR, churn rates)': 'Parámetros de configuración (segmentos, MRR base, tasas de abandono)',
    'Summary statistics, correlation matrices, trend plots': 'Estadísticas descriptivas, matrices de correlación y gráficos de tendencias',
    'All processed parquets + Jinja2 templates': 'Archivos Parquet procesados y plantillas Jinja2',
    'Running FastAPI service on :8052': 'Servicio FastAPI en ejecución',
    'KPI values, traffic lights, health score (0-100)': 'Valores de KPI, estados y puntuación de salud (0–100)',
    'All processed parquets + report config from frontend': 'Archivos Parquet procesados y configuración del informe',
    'PDF document (application/pdf)': 'Documento PDF (application/pdf)',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
          {t('technical.title')}
        </h2>
        <p className="text-sm text-[var(--fg-muted)]">{t('technical.subtitle')}</p>
      </div>

      {/* Notebook sub-tabs */}
      <SectionNav items={NOTEBOOKS.map(nb => ({ id: nb.id, label: language === 'es' ? nb.title_es : nb.title_en }))} value={activeNotebook} onChange={setActiveNotebook} />

      {/* Description card */}
      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-5"
      >
        <h3 className="text-base font-semibold text-[var(--fg-primary)] mb-2">
          {language === 'es' ? active.title_es : active.title_en}
        </h3>
        <p className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-4">
          {language === 'es' ? active.description_es : active.description_en}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-1">{text('Inputs', 'Entradas')}</p>
            <p className="text-xs text-[var(--fg-secondary)] font-mono break-words">{language === 'es' ? descriptions[active.inputs] ?? active.inputs : active.inputs}</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-1">{text('Outputs', 'Resultados')}</p>
            <p className="text-xs text-[var(--fg-secondary)] font-mono break-words">{language === 'es' ? descriptions[active.outputs] ?? active.outputs : active.outputs}</p>
          </div>
        </div>
      </motion.div>

      {/* Notebook iframe -- lazy loaded */}
      <p className="text-sm text-[var(--fg-muted)]">{text('Source notebooks retain their original language.', 'Los cuadernos originales conservan su idioma.')} <a href={`/kpi/notebooks_html/${active.file}`} target="_blank" rel="noopener noreferrer" className="underline">{text('Open notebook in a new tab', 'Abrir cuaderno en otra pestaña')}</a></p>
      <motion.div
        key={`iframe-${active.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        <iframe
          src={`/kpi/notebooks_html/${active.file}`}
          title={language === 'es' ? active.title_es : active.title_en}
          className="w-full border-0"
          style={{ height: '135vh' }}
          loading="lazy"
        />
      </motion.div>
    </div>
  )
}
