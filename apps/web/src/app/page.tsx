'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { projects, analysisName } from '@/lib/projects'
import { caseStudies } from '@/lib/case-studies'
import { usePreferences } from '@/components/SitePreferences'
import { EvidenceFigure } from '@/components/EvidenceFigure'

export default function HomePage() {
  const { locale, t } = usePreferences()
  return <main className="home-main publication-home">
    <header className="welcome-hero">
      <div className="welcome-copy">
        <p className="eyebrow">{t('Andrés González Ortega / Data analyst', 'Andrés González Ortega / Analista de datos')}</p>
        <h1>{t('Behind every number,', 'Detrás de cada número,')}<span>{t('a story to understand.', 'una historia por entender.')}</span></h1>
        <p className="welcome-description">{t('I’m Andrés. I’m drawn to statistics as a way of understanding the world: asking questions, testing ideas against evidence, and changing my mind when the data gives me reason to. This portfolio introduces classic problems we can tackle with data: comparing alternatives, understanding customer behavior, and estimating risk.', 'Soy Andrés. Me interesa la estadística como una forma de entender el mundo: hacer preguntas, poner las ideas a prueba y cambiar de opinión cuando los datos dan razones para hacerlo. Este portafolio es una introducción a problemas clásicos que podemos abordar con datos: comparar alternativas, entender el comportamiento de los clientes y estimar riesgos.')}</p>
        <div className="welcome-actions"><a href="#case-studies" className="primary-link">{t('Explore the stories', 'Explorar las historias')}<ArrowRight size={17} aria-hidden="true" /></a><a href="#how-to-read" className="text-link">{t('What will I find here?', '¿Qué voy a encontrar aquí?')}</a></div>
        <p className="welcome-reassurance">{t('No data background needed. Just a little curiosity.', 'No necesitas saber de datos. Solo un poco de curiosidad.')}</p>
      </div>
      <figure className="welcome-art">
        {/* Static export: responsive files are generated locally, with no image service. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/making-sense-1200.webp" srcSet="/images/making-sense-640.webp 640w, /images/making-sense-1200.webp 1200w" sizes="(max-width: 767px) calc(100vw - 40px), 50vw" width={1536} height={1024} fetchPriority="high" alt={t('Paper-cut illustration of receipts and a parcel being examined through a magnifying glass, beside a simple chart and notebook.', 'Ilustración de papel recortado: recibos y un paquete bajo una lupa, junto a una gráfica sencilla y un cuaderno.')} />
        <figcaption>{t('Everyday information. A clearer picture.', 'Información cotidiana. Una mirada más clara.')}</figcaption>
      </figure>
    </header>
    <section id="how-to-read" className="reading-welcome" aria-labelledby="reading-welcome-title">
      <div className="reading-welcome-heading"><p className="eyebrow">{t('A little orientation', 'Para empezar')}</p><h2 id="reading-welcome-title">{t('Not just charts. The thinking behind them.', 'No solo gráficas. Las ideas detrás de ellas.')}</h2><p>{t('A customer makes a purchase and never returns. Sales fall. An insurance claim still has no final cost. These seven stories begin with situations like these. We follow the clues in the data to understand what is happening and what we might do next.', 'Un cliente compra y no vuelve. Las ventas caen. Un siniestro todavía no tiene un costo final. Estas siete historias parten de situaciones como esas. Seguimos las pistas en los datos para entender qué ocurre y qué podríamos hacer después.')}</p></div>
      <ol className="reading-welcome-steps">
        <li><span className="reading-step-number" aria-hidden="true">01</span><h3>{t('Start with a question', 'Empezar con una pregunta')}</h3><p>{t('A situation you can recognize, with a reason to look closer.', 'Una situación que puedes reconocer y una razón para mirar más de cerca.')}</p></li>
        <li><span className="reading-step-number" aria-hidden="true">02</span><h3>{t('See what the data says', 'Ver qué dicen los datos')}</h3><p>{t('Visual explanations make patterns—and missing pieces—easier to see.', 'Explicaciones visuales para entender los patrones y lo que todavía falta saber.')}</p></li>
        <li><span className="reading-step-number" aria-hidden="true">03</span><h3>{t('Understand the decision', 'Entender la decisión')}</h3><p>{t('What the findings could change, and where we need to be careful.', 'Qué podrían cambiar los hallazgos y dónde hace falta tener cuidado.')}</p></li>
      </ol>
    </section>
    <section className="featured-study" aria-labelledby="featured-title"><div className="featured-copy"><p className="eyebrow"><span className="accent-line" />{t('Featured study / Insurance', 'Caso destacado / Seguros')}</p><h2 id="featured-title">{t('A claim has a date. Its final cost takes time.', 'Un siniestro tiene fecha. Su costo final toma tiempo.')}</h2><p>{t('Recent claims have a shorter history. Follow one accident year to see how observed payments become an estimate of the obligation still ahead.', 'Los siniestros recientes tienen menos historia. Sigue un año de accidente para ver cómo los pagos observados se convierten en una estimación de lo que falta por pagar.')}</p><Link href="/insurance/" className="primary-link">{t('Read the case study', 'Leer el caso de estudio')}<ArrowRight size={17} aria-hidden="true" /></Link><p className="featured-footnote">{t('CAS / NAIC · paid Chain-Ladder · historical regulatory aggregates', 'CAS / NAIC · Chain-Ladder pagado · agregados regulatorios históricos')}</p></div><EvidenceFigure kind="development" compact /></section>
    <section id="case-studies" className="case-studies" aria-labelledby="case-studies-title"><div className="section-heading"><div><p className="eyebrow">{t('The collection', 'La colección')}</p><h2 id="case-studies-title">{t('Seven questions worth investigating.', 'Siete preguntas que vale la pena investigar.')}</h2></div><span className="case-count">01—07</span></div><div className="study-list">{projects.map((project, index) => {
      const study = caseStudies[project.id]
      return <article className="case-card study-row" key={project.id}><div className="study-row-copy"><div className="case-top"><span className="case-number">{String(index + 1).padStart(2, '0')}</span><span className="eyebrow">{project.category[locale]}</span></div><h3><Link href={project.paths[0]}>{study.question[locale]}<ArrowUpRight size={20} aria-hidden="true" /></Link></h3><p>{study.finding[locale]}</p><span className="study-evidence">{study.evidenceLabel[locale]}</span><div className="case-tools">{project.tools.map(tool => <span key={tool}>{tool}</span>)}</div>{project.paths.length > 1 && <div className="case-analyses">{project.paths.map(path => <Link key={path} href={path}>{analysisName(path, locale)}<ArrowRight size={13} aria-hidden="true" /></Link>)}</div>}</div><div className="study-row-figure"><EvidenceFigure kind={study.figure} compact /></div></article>
    })}</div></section>
    <section className="home-about"><p className="eyebrow">{t('How I approach the work', 'Cómo abordo el trabajo')}</p><div><p>{t('I studied actuarial science at UNAM. My work connects quantitative methods with questions about customers, risk, and operations. These studies show the reasoning, assumptions, and limits behind the result.', 'Estudié Actuaría en la UNAM. Mi trabajo conecta métodos cuantitativos con preguntas sobre clientes, riesgo y operaciones. Estos casos muestran el razonamiento, los supuestos y los límites detrás del resultado.')}</p><p>{t('Public data, synthetic demonstrations, and modeled scenarios are identified in each case. The methods and research are available alongside the visual explanation.', 'Cada caso identifica los datos públicos, las demostraciones sintéticas y los escenarios modelados. Los métodos y la investigación acompañan la explicación visual.')}</p></div></section>
  </main>
}
