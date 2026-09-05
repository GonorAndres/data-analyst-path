'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Project } from '@/lib/projects'
import { caseStudies } from '@/lib/case-studies'
import { useCaseView, type CaseView } from '@/hooks/useCaseView'
import { usePreferences } from './SitePreferences'
import { EvidenceFigure } from './EvidenceFigure'
import { CaseWelcome } from './CaseWelcome'
import evidence from '@/lib/evidence-snapshots.json'

export function CaseExperience({ project, children }: { project: Project; children: React.ReactNode }) {
  const pathname = usePathname()
  const { t, locale } = usePreferences()
  const normalized = pathname.replace(/\/$/, '')
  const root = project.paths.find(path => normalized === path.replace(/\/$/, ''))
  const base = project.paths.find(path => pathname.startsWith(path.replace(/\/$/, '') + '/')) ?? project.paths[0]
  const [view, setView] = useCaseView(!root)
  const study = caseStudies[project.id]
  const tabs: { id: CaseView; label: string }[] = [
    { id: 'story', label: t('Case study', 'Caso de estudio') },
    { id: 'explore', label: t('Explore', 'Explorar') },
    { id: 'methods', label: t('Methods & sources', 'Métodos y fuentes') },
  ]

  return <>
    <nav className="case-view-nav" aria-label={t('Case study views', 'Vistas del caso de estudio')}>
      {tabs.map(tab => !root && tab.id !== 'explore'
        ? <Link key={tab.id} href={`${base}${tab.id === 'methods' ? '?view=methods' : ''}`}>{tab.label}</Link>
        : <button type="button" key={tab.id} aria-current={view === tab.id ? 'page' : undefined} onClick={() => setView(tab.id)}>{tab.label}</button>)}
      <span>{project.category[locale]}</span>
    </nav>
    {view === 'story' && <main className="case-story">
      <CaseWelcome introductionId={normalized === '/olist' ? 'olist' : project.id} />
      <header className="case-intro" id="case-analysis">
        <p className="eyebrow">{project.category[locale]} <span aria-hidden="true">/</span> {t('An analytical case study', 'Un caso de análisis')}</p>
        <h1>{study.title[locale]}</h1>
        <p className="case-question">{study.question[locale]}</p>
        <div className="case-provenance"><span className="evidence-tag">{study.evidenceLabel[locale]}</span></div>
      </header>
      <section className="case-opening" aria-labelledby="case-finding">
        <div className="case-opening-copy"><p className="eyebrow">{t('The finding', 'El hallazgo')}</p><h2 id="case-finding">{study.finding[locale]}</h2><div className="analyst-contribution"><p className="eyebrow">{t('Analytical work', 'Trabajo analítico')}</p><p>{study.contribution[locale]}</p></div><button className="text-link" onClick={() => setView('explore')}>{t('Explore the underlying analysis', 'Explorar el análisis de apoyo')}<ArrowRight size={16} aria-hidden="true" /></button></div>
        <EvidenceFigure key={study.id} kind={study.figure} />
      </section>
      <div className="case-reading">
        <aside className="reading-index"><p className="eyebrow">{t('Read the evidence', 'Leer la evidencia')}</p><nav aria-label={t('In this case study', 'En este caso de estudio')}>{study.sections.map((section, i) => <a href={`#reading-${i + 1}`} key={i}><span>0{i + 1}</span>{section.title[locale]}</a>)}<a href="#decision"><span>04</span>{t('Decision & limits', 'Decisión y límites')}</a></nav></aside>
        <div>{study.sections.map((section, i) => <section className="reading-section" id={`reading-${i + 1}`} key={i}><p className="eyebrow">0{i + 1}</p><h2>{section.title[locale]}</h2><p>{section.body[locale]}</p></section>)}
          <section className="decision-section" id="decision"><p className="eyebrow">{t('Decision supported', 'Decisión que apoya')}</p><h2>{t('What to do with this evidence', 'Qué hacer con esta evidencia')}</h2><p>{study.decision[locale]}</p><h3>{t('What this analysis cannot establish', 'Qué no puede establecer este análisis')}</h3><ul>{study.limitations.map((limit, i) => <li key={i}>{limit[locale]}</li>)}</ul></section>
        </div>
      </div>
      <section className="case-next"><div><p className="eyebrow">{t('Continue the investigation', 'Continuar la investigación')}</p><h2>{t('Inspect the evidence behind the story.', 'Examinar la evidencia detrás del caso.')}</h2></div><div><button className="primary-link" onClick={() => setView('explore')}>{t('Explore the analysis', 'Explorar el análisis')}<ArrowRight size={16} aria-hidden="true" /></button><button className="text-link" onClick={() => setView('methods')}>{t('Methods & sources', 'Métodos y fuentes')}<ArrowUpRight size={16} aria-hidden="true" /></button></div></section>
    </main>}
    {view === 'explore' && <div className="case-exploration"><aside className="exploration-note"><strong>{study.evidenceLabel[locale]}</strong><details><summary>{t('About the data and filters', 'Sobre los datos y filtros')}</summary><p>{study.coverage[locale]}</p><p>{t('Filters update this dashboard, not the case-study text. Some charts use their own filters.', 'Los filtros actualizan este panel, no el texto del caso. Algunas gráficas tienen sus propios filtros.')}</p><ul>{study.limitations.map((limit, i) => <li key={i}>{limit[locale]}</li>)}</ul></details></aside>{children}</div>}
    {view === 'methods' && <main className="case-methods"><header className="case-intro"><p className="eyebrow">{project.category[locale]}</p><h1>{t('Methods & sources', 'Métodos y fuentes')}</h1><p className="case-question">{study.question[locale]}</p><div className="case-provenance"><span className="evidence-tag">{study.evidenceLabel[locale]}</span><p>{study.coverage[locale]}</p></div></header><div className="methods-columns"><section><h2>{t('Source material', 'Material de origen')}</h2><p>{t('Start with the dataset and its coverage, then inspect the preparation and analytical choices.', 'Comienza con los datos y su cobertura, después revisa la preparación y las decisiones analíticas.')}</p><ul className="research-links">{study.sources.map(source => <li key={source.href}><a href={source.href}>{source.label}<ArrowUpRight size={16} aria-hidden="true" /></a></li>)}</ul><h2>{t('Research & reports', 'Investigación e informes')}</h2><ul className="research-links">{study.artifacts.map(artifact => <li key={artifact.href}><a href={artifact.href}>{artifact.label[locale]}<ArrowUpRight size={16} aria-hidden="true" /></a></li>)}</ul><p className="source-note">{t('Original research retains its source language. Notebook files can be downloaded for reproduction; HTML notebooks are readable in the browser.', 'La investigación original conserva su idioma. Los notebooks se pueden descargar para reproducirlos; las versiones HTML se leen en el navegador.')}</p></section><section><h2>{t('Assumptions & limits', 'Supuestos y límites')}</h2><ul className="method-limitations">{study.limitations.map((limit, i) => <li key={i}>{limit[locale]}</li>)}</ul><h2>{t('Evidence provenance', 'Procedencia de la evidencia')}</h2><p>{t('Narrative review', 'Revisión narrativa')}: {evidence.reviewedAt}. {t('Measured figures identify their retained source and population. Conceptual figures are explicitly labeled. Report dates describe their own analysis window.', 'Las figuras medidas identifican su fuente conservada y población. Las figuras conceptuales están etiquetadas. Las fechas de los informes describen su propio periodo analítico.')}</p><a className="text-link" href="/research/evidence-audit.md">{t('Read the evidence audit', 'Leer la auditoría de evidencia')}<ArrowUpRight size={16} aria-hidden="true" /></a></section></div></main>}
  </>
}
