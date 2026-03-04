import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BackendWarmup } from '@/components/olist/BackendWarmup'
import { ArrowUpRight } from 'lucide-react'

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
            {/* Airbnb — active */}
            <Link
              href="/airbnb"
              className="bg-paper dark:bg-[#141414] p-8 group hover:bg-surface dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-sans text-xs tracking-widest uppercase text-accent-amber">Análisis exploratorio</span>
                <ArrowUpRight size={16} className="text-muted group-hover:text-ink dark:group-hover:text-[#F0EFEB] transition-colors" />
              </div>
              <h2 className="font-serif text-3xl leading-tight mb-3">Airbnb CDMX<br />Análisis de Mercado</h2>
              <p className="font-sans text-sm text-muted leading-relaxed mb-6">
                Dinámica de precios, segmentación de anfitriones y patrones de demanda por alcaldía en 10,000+ ofertas en Ciudad de México.
              </p>
              <div className="flex gap-3 flex-wrap">
                {['Python', 'Next.js', 'Recharts'].map(t => (
                  <span key={t} className="font-sans text-xs border border-border dark:border-[#2a2a2a] px-2 py-1">{t}</span>
                ))}
              </div>
            </Link>

            {/* Olist — active */}
            <Link
              href="/olist"
              className="bg-paper dark:bg-[#141414] p-8 group hover:bg-surface dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-sans text-xs tracking-widest uppercase text-accent-amber">Análisis exploratorio</span>
                <ArrowUpRight size={16} className="text-muted group-hover:text-ink dark:group-hover:text-[#F0EFEB] transition-colors" />
              </div>
              <h2 className="font-serif text-3xl leading-tight mb-3">Olist E-Commerce<br />Análisis de Cohortes</h2>
              <p className="font-sans text-sm text-muted leading-relaxed mb-6">
                Retención de clientes, LTV por cohorte y análisis de conversión en el embudo del marketplace más grande de Brasil.
              </p>
              <div className="flex gap-3 flex-wrap">
                {['Python', 'FastAPI', 'Next.js', 'Recharts'].map(t => (
                  <span key={t} className="font-sans text-xs border border-border dark:border-[#2a2a2a] px-2 py-1">{t}</span>
                ))}
              </div>
            </Link>
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
