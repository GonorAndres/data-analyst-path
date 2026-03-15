'use client'
import {
  Target,
  Lightbulb,
  Database,
  BarChart3,
  Layout,
  BookOpen,
  Cpu,
  ArrowRight,
  Briefcase,
} from 'lucide-react'
import type { ReactNode } from 'react'

/* ── helpers ─────────────────────────────────────────────────── */

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Target
  title: string
  children: ReactNode
}) {
  return (
    <div className="bg-ops-surface border border-ops-border p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className="w-5 h-5 text-ops-blue shrink-0" />
        <h2 className="font-sans text-lg font-semibold text-ops-text">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function TabGuide({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <ArrowRight className="w-4 h-4 text-ops-blue shrink-0 mt-0.5" />
      <div>
        <span className="font-medium text-sm text-ops-text">{name}</span>
        <span className="text-sm text-ops-text-muted ml-1.5">: {desc}</span>
      </div>
    </div>
  )
}

/* ── data ────────────────────────────────────────────────────── */

const PORTFOLIO_PROJECTS = [
  {
    num: '01',
    title: 'Insurance Claims Dashboard',
    domain: 'Financial / Insurance',
    desc: 'Siniestralidad, reservas y tendencias para una cartera de seguros.',
    tech: ['Next.js', 'SQL', 'Python'],
  },
  {
    num: '02',
    title: 'E-Commerce Cohort Analysis',
    domain: 'Product / Growth',
    desc: 'Analisis de cohortes, retencion, RFM y LTV para e-commerce.',
    tech: ['SQL', 'Python', 'Streamlit'],
  },
  {
    num: '03',
    title: 'A/B Test Analysis',
    domain: 'Product / Growth',
    desc: 'Pruebas A/B con enfoque frecuentista, bayesiano y secuencial.',
    tech: ['R', 'Python', 'Next.js'],
  },
  {
    num: '04',
    title: 'Executive KPI Report',
    domain: 'Business / General',
    desc: 'Reportes automatizados de KPIs SaaS con deteccion de anomalias.',
    tech: ['Python', 'Next.js'],
  },
  {
    num: '05',
    title: 'Financial Portfolio Tracker',
    domain: 'Financial / Analytics',
    desc: 'Portfolio multi-activo con VaR, Monte Carlo y frontera eficiente.',
    tech: ['Python', 'Next.js', 'Recharts'],
  },
  {
    num: '06',
    title: 'Operational Efficiency',
    domain: 'Business / Operations',
    desc: 'Eficiencia operacional NYC 311 con mineria de procesos y SLA.',
    tech: ['Python', 'Next.js', 'D3.js'],
    current: true,
  },
]

const METHODOLOGY_CARDS = [
  {
    title: 'Pipeline de Datos',
    color: '#7EB8DA', // ops-cyan
    items: ['ETL en 3 etapas via Socrata API', 'Limpieza y tipificacion de 3.5M registros', 'Exportacion a parquet columnar'],
  },
  {
    title: 'Analisis de SLA',
    color: '#6FCF97', // ops-green
    items: ['Pruebas z para comparacion de tasas', 'Correccion de Bonferroni para comparaciones multiples', 'Clasificacion de cumplimiento por agencia'],
  },
  {
    title: 'Mineria de Procesos',
    color: '#D4A15E', // ops-blue (brass)
    items: ['Diagrama Sankey de flujo operacional', 'Deteccion de cuellos de botella', 'Descomposicion de tiempos de resolucion'],
  },
  {
    title: 'Pareto y Priorizacion',
    color: '#C084FC', // ops-purple
    items: ['Regla 80/20 por tipo de queja', 'Scatter matrix de prioridad', 'Analisis de concentracion por agencia'],
  },
]

const TAB_GUIDE = [
  { tab: 'Contexto', desc: 'Contexto del proyecto, metodologia y como navegar el dashboard.' },
  { tab: 'Resumen Ejecutivo', desc: 'Veredicto SLA, KPIs principales y tipos de queja mas frecuentes.' },
  { tab: 'Flujo de Procesos', desc: 'Diagrama Sankey del flujo operacional y tiempos de resolucion.' },
  { tab: 'Rendimiento por Agencia', desc: 'Comparativa de eficiencia entre agencias con pruebas estadisticas.' },
  { tab: 'Analisis Geografico', desc: 'Mapa coropletico de solicitudes por codigo postal y municipio.' },
  { tab: 'Tendencias y Estacionalidad', desc: 'Series de tiempo, heatmaps y patrones estacionales.' },
  { tab: 'Pareto y Prioridades', desc: 'Diagrama de Pareto y matriz de priorizacion por volumen e impacto.' },
  { tab: 'Proceso Tecnico', desc: 'Notebooks Jupyter completos con el pipeline de analisis.' },
]

const CHALLENGES = [
  {
    title: '3.5M filas en el navegador',
    desc: 'Procesamiento de 3.5 millones de registros requirio column pruning en parquet y agregacion en el backend para mantener tiempos de carga aceptables en Cloud Run.',
  },
  {
    title: 'D3.js custom vs librerias prefabricadas',
    desc: 'Visualizaciones clave (Sankey, coropletico, gauge) necesitaban control total de layout e interaccion que Recharts no ofrecia. Se implementaron desde cero con D3.',
  },
  {
    title: 'Datos SLA nulos',
    desc: 'Muchas agencias (NYPD, Parks) carecen de definicion de SLA en el dataset. Se implemento codificacion defensiva y se reportan como "Sin SLA definido" en vez de excluirlas.',
  },
  {
    title: 'Sparsity en heatmaps',
    desc: 'El bucket "Otros" dominaba los heatmaps de tipo de queja. Se cambio a complaint_type sin agrupar, filtrando por top N, para revelar patrones utiles.',
  },
]

const TECH_STACK = {
  'Data Pipeline': ['Python', 'pandas', 'Socrata API', 'parquet', 'scipy'],
  Backend: ['FastAPI', 'uvicorn', 'Cloud Run', 'GCS'],
  Frontend: ['Next.js', 'React', 'D3.js', 'Tailwind CSS', 'Recharts'],
}

const DEFINITIONS = [
  { term: 'SLA', desc: 'Service Level Agreement: tiempo maximo comprometido para resolver una solicitud.' },
  { term: 'Mineria de Procesos', desc: 'Tecnica para descubrir y analizar flujos de trabajo reales a partir de logs de eventos.' },
  { term: 'Principio de Pareto', desc: 'El 80% de los efectos proviene del 20% de las causas. Se usa para priorizar tipos de queja.' },
  { term: 'Diagrama Sankey', desc: 'Visualizacion de flujo donde el ancho de cada banda es proporcional al volumen que transporta.' },
  { term: 'Correccion de Bonferroni', desc: 'Ajuste del nivel de significancia al hacer multiples pruebas estadisticas simultaneas.' },
  { term: 'Coropletico', desc: 'Mapa donde las areas se colorean segun la intensidad de una variable (solicitudes por zona).' },
  { term: 'Tiempo de Resolucion', desc: 'Dias transcurridos entre la apertura y el cierre de una solicitud 311.' },
  { term: 'Cuello de Botella', desc: 'Etapa del proceso donde se acumula trabajo y se alarga el tiempo de resolucion.' },
]

/* ── component ───────────────────────────────────────────────── */

export function IntroPanel() {
  return (
    <div className="space-y-6 pb-4">
      {/* 1. Hero */}
      <div className="bg-ops-surface border border-ops-border p-6 md:p-8">
        <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-ops-text-muted mb-2">
          Data Analyst Portfolio: Project 06
        </p>
        <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-ops-text mb-3">
          Eficiencia Operacional NYC 311
        </h2>
        <p className="font-sans text-sm md:text-base leading-relaxed text-ops-text-muted max-w-3xl">
          Dashboard de analisis operacional sobre las solicitudes 311 de la Ciudad de Nueva York.
          Combina mineria de procesos, analisis estadistico de SLA y priorizacion Pareto para
          identificar cuellos de botella, evaluar el cumplimiento de tiempos de respuesta y guiar
          decisiones de mejora operativa a traves de 3.5 millones de registros del 2024.
        </p>
      </div>

      {/* 2. Challenge + Why This Approach */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard icon={Target} title="El Reto">
          <ul className="space-y-2 font-sans text-sm text-ops-text-muted">
            <li className="flex gap-2"><span className="text-ops-blue">*</span>Que agencias cumplen sus compromisos de tiempo de respuesta y cuales no?</li>
            <li className="flex gap-2"><span className="text-ops-blue">*</span>Donde se concentran los cuellos de botella en el flujo operacional?</li>
            <li className="flex gap-2"><span className="text-ops-blue">*</span>Que tipos de queja generan el mayor volumen y como priorizarlos?</li>
            <li className="flex gap-2"><span className="text-ops-blue">*</span>Existen patrones geograficos o estacionales en las solicitudes?</li>
          </ul>
        </SectionCard>

        <SectionCard icon={Lightbulb} title="Por Que Este Enfoque">
          <ul className="space-y-2 font-sans text-sm text-ops-text-muted">
            <li className="flex gap-2"><span className="text-ops-blue">*</span>Mineria de procesos revela el flujo real, no el teorico, de las operaciones.</li>
            <li className="flex gap-2"><span className="text-ops-blue">*</span>Pruebas estadisticas (z-test + Bonferroni) dan rigor a la comparacion entre agencias.</li>
            <li className="flex gap-2"><span className="text-ops-blue">*</span>Visualizaciones D3.js custom (Sankey, coropletico, gauge) permiten explorar datos complejos.</li>
            <li className="flex gap-2"><span className="text-ops-blue">*</span>Pipeline parquet + FastAPI mantiene 3.5M filas consultables en milisegundos.</li>
          </ul>
        </SectionCard>
      </div>

      {/* 3. Data Source */}
      <SectionCard icon={Database} title="Fuente de Datos">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Fuente', value: 'NYC Open Data / Socrata API' },
            { label: 'Registros', value: '~3.5 millones de filas' },
            { label: 'Periodo', value: 'Enero - Diciembre 2024' },
            { label: 'Dataset ID', value: 'erm2-nwe9' },
          ].map((cell) => (
            <div key={cell.label}>
              <p className="font-mono text-[11px] tracking-wider uppercase text-ops-text-muted mb-1">{cell.label}</p>
              <p className="font-sans text-sm text-ops-text">{cell.value}</p>
            </div>
          ))}
        </div>
        <p className="font-sans text-xs text-ops-text-muted leading-relaxed">
          Limitaciones: datos gubernamentales con calidad variable. No todas las agencias tienen SLA definido
          (ej. NYPD, Parks). No se incluyen datos de costos operativos. Los tiempos de resolucion dependen
          de la fecha de cierre registrada, que puede no reflejar la resolucion real.
        </p>
      </SectionCard>

      {/* 4. Portfolio Context */}
      <div className="bg-ops-surface border border-ops-border p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Briefcase className="w-5 h-5 text-ops-blue shrink-0" />
          <h2 className="font-sans text-lg font-semibold text-ops-text">Contexto del Portafolio</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PORTFOLIO_PROJECTS.map((p) => (
            <div
              key={p.num}
              className={`p-4 border ${
                p.current
                  ? 'border-ops-blue/50 bg-ops-blue/5'
                  : 'border-ops-border bg-ops-bg'
              }`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-xs text-ops-blue font-semibold">{p.num}</span>
                <span className="font-sans text-sm font-medium text-ops-text">{p.title}</span>
              </div>
              <span className="inline-block font-mono text-[10px] tracking-wider uppercase text-ops-text-muted mb-2">
                {p.domain}
              </span>
              <p className="font-sans text-xs text-ops-text-muted leading-relaxed mb-2">{p.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[10px] font-mono border border-ops-border text-ops-text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {p.current && (
                <p className="font-mono text-[10px] text-ops-blue mt-2 tracking-wider uppercase">
                  Proyecto actual
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Methodology */}
      <SectionCard icon={BarChart3} title="Metodologia">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {METHODOLOGY_CARDS.map((card) => (
            <div
              key={card.title}
              className="p-4"
              style={{
                background: `color-mix(in srgb, ${card.color} 6%, transparent)`,
                border: `1px solid color-mix(in srgb, ${card.color} 18%, transparent)`,
              }}
            >
              <h3 className="font-sans text-sm font-semibold text-ops-text mb-2">{card.title}</h3>
              <ul className="space-y-1">
                {card.items.map((item) => (
                  <li key={item} className="font-sans text-xs text-ops-text-muted flex gap-1.5">
                    <span style={{ color: card.color }}>-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 6. How to Navigate */}
      <SectionCard icon={Layout} title="Como Navegar">
        <div className="space-y-2.5">
          {TAB_GUIDE.map((item) => (
            <TabGuide key={item.tab} name={item.tab} desc={item.desc} />
          ))}
        </div>
      </SectionCard>

      {/* 7. Challenges & Learnings */}
      <SectionCard icon={BookOpen} title="Retos y Aprendizajes">
        <div className="space-y-4">
          {CHALLENGES.map((item, i) => (
            <div key={item.title} className="flex gap-3">
              <span className="font-mono text-sm font-semibold text-ops-blue shrink-0 w-6 text-right">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="font-sans text-sm font-medium text-ops-text">{item.title}</p>
                <p className="font-sans text-sm text-ops-text-muted mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 8. Tech Stack */}
      <div className="bg-ops-surface border border-ops-border p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Cpu className="w-5 h-5 text-ops-blue shrink-0" />
          <h2 className="font-sans text-lg font-semibold text-ops-text">Stack Tecnologico</h2>
        </div>
        <div className="space-y-4">
          {Object.entries(TECH_STACK).map(([category, tools]) => (
            <div key={category}>
              <p className="font-mono text-[11px] tracking-wider uppercase text-ops-text-muted mb-2">{category}</p>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-2.5 py-1 text-xs font-mono border border-ops-blue/20 text-ops-blue"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Key Definitions */}
      <div className="bg-ops-surface border border-ops-border p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <BookOpen className="w-5 h-5 text-ops-blue shrink-0" />
          <h2 className="font-sans text-lg font-semibold text-ops-text">Definiciones Clave</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
          {DEFINITIONS.map((item) => (
            <div key={item.term}>
              <span className="font-medium text-sm text-ops-text">{item.term}: </span>
              <span className="text-sm text-ops-text-muted">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
