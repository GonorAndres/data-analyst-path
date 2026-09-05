'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { projects, analysisName } from '@/lib/projects'
import { usePreferences } from '@/components/SitePreferences'

export default function HomePage() {
  const { locale, t } = usePreferences()
  return <main className="home-main">
    <section className="home-hero">
      <div>
        <p className="eyebrow"><span className="accent-line" />{t('Andrés González Ortega / Data analyst', 'Andrés González Ortega / Analista de datos')}</p>
        <h1>{t('Make the data', 'Entender los datos.')}<br /><span>{t('mean something.', 'Mejorar las decisiones.')}</span></h1>
        <p className="hero-description">{t('I turn complex datasets into clear business questions, evidence, and decisions. Explore my work across insurance, product, finance, and operations.', 'Convierto conjuntos de datos complejos en preguntas de negocio, evidencia y decisiones claras. Explora mi trabajo en seguros, producto, finanzas y operaciones.')}</p>
        <a href="#case-studies" className="primary-link">{t('Explore the work', 'Explorar los proyectos')}<ArrowRight size={17} aria-hidden="true" /></a>
      </div>
      <aside className="hero-note">
        <p className="eyebrow">{t('From question to evidence', 'De la pregunta a la evidencia')}</p>
        <ol><li><span>01</span>{t('Define the business question', 'Definir la pregunta de negocio')}</li><li><span>02</span>{t('Explore and test the evidence', 'Explorar y contrastar la evidencia')}</li><li><span>03</span>{t('Explain the decision', 'Explicar la decisión')}</li></ol>
        <p>{t('Interactive analyses, transparent methods, and the technical work behind each result.', 'Análisis interactivos, métodos transparentes y el trabajo técnico detrás de cada resultado.')}</p>
      </aside>
    </section>
    <section id="case-studies" className="case-studies" aria-labelledby="case-studies-title">
      <div className="section-heading"><div><p className="eyebrow">{t('Selected work', 'Trabajo seleccionado')}</p><h2 id="case-studies-title">{t('Different questions. The same rigor.', 'Preguntas distintas. El mismo rigor.')}</h2></div><span className="case-count">07 {t('case studies', 'casos de estudio')}</span></div>
      <div className="case-grid">
        {projects.map((project, index) => <article className="case-card" key={project.id}>
          <div className="case-top"><span className="eyebrow">{project.category[locale]}</span><span className="case-number">{String(index + 1).padStart(2, '0')}</span></div>
          <h3><Link href={project.paths[0]}>{project.title[locale]}<ArrowUpRight size={20} aria-hidden="true" /></Link></h3>
          <p>{project.description[locale]}</p>
          <div className="case-tools">{project.tools.map(tool => <span key={tool}>{tool}</span>)}</div>
          {project.paths.length > 1 && <div className="case-analyses">{project.paths.map(path => <Link key={path} href={path}>{analysisName(path, locale)}<ArrowRight size={13} aria-hidden="true" /></Link>)}</div>}
        </article>)}
      </div>
    </section>
    <section className="home-about"><p className="eyebrow">{t('About the work', 'Acerca del trabajo')}</p><p>{t('I studied actuarial science at UNAM. These projects connect quantitative methods with the questions teams need to answer. Each analysis includes its data sources, assumptions, and limitations.', 'Estudié Actuaría en la UNAM. Estos proyectos conectan métodos cuantitativos con las preguntas que necesitan responder los equipos. Cada análisis incluye sus fuentes, supuestos y limitaciones.')}</p></section>
  </main>
}
