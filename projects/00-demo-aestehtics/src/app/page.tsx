import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BackendWarmup } from '@/components/olist/BackendWarmup'
import { ArrowUpRight } from 'lucide-react'

// Índice completo del portafolio DA. Las URLs externas deben coincidir con
// ops/urls.yml (fuente única de verdad) — actualizar ambos al cambiar dominios.
const projects = [
  {
    href: '/airbnb',
    external: false,
    category: 'Análisis exploratorio',
    title: <>Airbnb CDMX<br />Análisis de Mercado</>,
    description:
      'Dinámica de precios, segmentación de anfitriones y patrones de demanda por alcaldía en 10,000+ ofertas en Ciudad de México.',
    tools: ['Python', 'Next.js', 'Recharts'],
  },
  {
    href: '/olist',
    external: false,
    category: 'Análisis exploratorio',
    title: <>Olist E-Commerce<br />Embudo y Conversión</>,
    description:
      'Conversión por etapa del embudo, categorías y desempeño de vendedores en el marketplace más grande de Brasil.',
    tools: ['Python', 'FastAPI', 'Next.js', 'Recharts'],
  },
  {
    href: '/insurance',
    external: false,
    category: 'Seguros',
    title: <>Dashboard de<br />Siniestros</>,
    description:
      'Frecuencia, severidad y reservas de una cartera de seguros, con resumen ejecutivo y análisis SQL.',
    tools: ['SQL', 'Python', 'FastAPI', 'Next.js'],
  },
  {
    href: '/cohorts',
    external: false,
    category: 'Producto',
    title: <>Cohortes y RFM<br />E-Commerce</>,
    description:
      'Por qué sólo el 3% de los clientes vuelve a comprar: retención por cohortes, supervivencia Kaplan-Meier, segmentos RFM y factores de activación.',
    tools: ['SQL', 'Python', 'Next.js', 'Recharts'],
  },
  {
    href: '/abtest',
    external: false,
    category: 'Producto',
    title: <>Análisis de<br />Pruebas A/B</>,
    description:
      'Diseño y evaluación estadística de un experimento: potencia, significancia e impacto de negocio.',
    tools: ['Python', 'Next.js', 'FastAPI'],
  },
  {
    href: '/kpi',
    external: false,
    category: 'Operaciones',
    title: <>Reporte Ejecutivo<br />de KPIs</>,
    description:
      'KPIs de negocio automatizados con reportes PDF programados y tablero ejecutivo.',
    tools: ['Python', 'Next.js', 'FastAPI'],
  },
  {
    href: '/portfolio',
    external: false,
    category: 'Finanzas',
    title: <>Portafolio<br />Financiero</>,
    description:
      'Seguimiento de portafolio de inversión: rendimiento, riesgo y métricas financieras en tiempo real.',
    tools: ['Python', 'Next.js', 'FastAPI'],
  },
  {
    href: '/operations',
    external: false,
    category: 'Operaciones',
    title: <>Eficiencia<br />Operativa</>,
    description:
      'Análisis de procesos y cuellos de botella con minería de procesos y visualización D3.',
    tools: ['Next.js', 'D3.js', 'FastAPI'],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper dark:bg-[#141414] text-ink dark:text-[#F0EFEB]">
      <BackendWarmup />
      {/* Header */}
      <header className="border-b border-border dark:border-[#2a2a2a] px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-sans text-xs tracking-widest uppercase text-muted">Portafolio</span>
        <ThemeToggle />
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-20 pb-16 border-b border-border dark:border-[#2a2a2a]">
          <p className="font-sans text-xs tracking-widest uppercase text-muted mb-6">Analista de Datos</p>
          <h1 className="font-serif text-6xl md:text-8xl leading-none tracking-tight mb-8">
            Andrés<br />González Ortega
          </h1>
          <p className="font-sans text-lg text-muted max-w-xl leading-relaxed">
            Licenciado en Actuaría por la UNAM, convirtiendo datos complejos en decisiones de negocio.
            Especializado en analítica de seguros, producto y finanzas.
          </p>
        </section>

        {/* Case Studies */}
        <section className="py-16">
          <p className="font-sans text-xs tracking-widest uppercase text-muted mb-8">Casos de Estudio</p>
          <div className="grid md:grid-cols-2 gap-px bg-border dark:bg-[#2a2a2a]">
            {projects.map((p, i) => {
              const cardContent = (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <span className="font-sans text-xs tracking-widest uppercase text-accent-amber">{p.category}</span>
                    <ArrowUpRight size={16} className="text-muted group-hover:text-ink dark:group-hover:text-[#F0EFEB] transition-colors" />
                  </div>
                  <h2 className="font-serif text-3xl leading-tight mb-3">{p.title}</h2>
                  <p className="font-sans text-sm text-muted leading-relaxed mb-6">
                    {p.description}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {p.tools.map(t => (
                      <span key={t} className="font-sans text-xs border border-border dark:border-[#2a2a2a] px-2 py-1">{t}</span>
                    ))}
                  </div>
                </>
              )
              const cardClass = 'bg-paper dark:bg-[#141414] p-8 group hover:bg-surface dark:hover:bg-[#1a1a1a] transition-colors'
              return p.external ? (
                <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
                  {cardContent}
                </a>
              ) : (
                <Link key={i} href={p.href} className={cardClass}>
                  {cardContent}
                </Link>
              )
            })}
          </div>
        </section>

        {/* Tech stack */}
        <section className="py-12 border-t border-border dark:border-[#2a2a2a]">
          <p className="font-sans text-xs tracking-widest uppercase text-muted mb-6">Herramientas</p>
          <div className="flex flex-wrap gap-4">
            {['Python', 'SQL', 'R', 'Streamlit', 'Next.js', 'Recharts'].map(t => (
              <span key={t} className="font-sans text-sm text-muted">{t}</span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border dark:border-[#2a2a2a] flex items-center justify-between">
          <span className="font-sans text-xs text-muted">Ciudad de México, 2026</span>
          <span className="font-sans text-xs text-muted">Licenciado en Actuaría · UNAM</span>
        </footer>
      </main>
    </div>
  )
}
