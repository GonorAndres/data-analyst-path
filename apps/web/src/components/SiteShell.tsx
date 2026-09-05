'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown, Moon, Sun } from 'lucide-react'
import { analysisName, projectForPath, projects, routeTitles } from '@/lib/projects'
import { usePreferences } from './SitePreferences'

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { locale, theme, setLocale, setTheme, t } = usePreferences()
  const pathname = usePathname()
  const active = projectForPath(pathname)
  const [open, setOpen] = useState(false)
  const menu = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    const title = routeTitles[pathname.replace(/\/$/, '') || '/']
    if (title) document.title = `${title[locale]} — Andrés González Ortega`
  }, [pathname, locale])
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!menu.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', escape) }
  }, [open])

  return <>
    <a className="skip-link" href="#main-content">{t('Skip to content', 'Saltar al contenido')}</a>
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href="/" aria-label={t('Andrés González — home', 'Andrés González — inicio')}>
          <span className="brand-mark" aria-hidden="true">ag<span>.</span></span>
          <span className="brand-caption">{t('Analytics portfolio', 'Portafolio de analítica')}</span>
        </Link>
        <div className="site-controls">
          <div className="project-menu" ref={menu}>
            <button type="button" ref={trigger} className="ui-button" aria-expanded={open} aria-controls="project-menu"
              onClick={() => setOpen(!open)}>{t('Projects', 'Proyectos')}<ChevronDown size={14} aria-hidden="true" /></button>
            {open && <nav id="project-menu" className="project-menu-panel" aria-label={t('Projects', 'Proyectos')}>
              <Link href="/" onClick={() => setOpen(false)}>{t('All case studies', 'Todos los casos de estudio')}<ArrowUpRight size={14} aria-hidden="true" /></Link>
              {projects.flatMap(project => project.paths.map(path => <Link key={path} href={path}
                aria-current={pathname.replace(/\/$/, '') === path.replace(/\/$/, '') ? 'page' : undefined}
                onClick={() => setOpen(false)}>
                {project.paths.length > 1 ? analysisName(path, locale) : project.category[locale]}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>))}
            </nav>}
          </div>
          <button className="ui-button language-button" type="button" onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
            aria-label={t('Switch to Spanish', 'Cambiar a inglés')}><span lang={locale === 'en' ? 'es' : 'en'}>{locale === 'en' ? 'ES' : 'EN'}</span></button>
          <button className="ui-button icon-button" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? t('Switch to dark theme', 'Cambiar a tema oscuro') : t('Switch to light theme', 'Cambiar a tema claro')}>
            {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
    {active && <div className="project-context">
      <nav className="breadcrumbs" aria-label={t('Breadcrumb', 'Ruta de navegación')}>
        <Link href="/">{t('Case studies', 'Casos de estudio')}</Link><span aria-hidden="true">/</span><span>{active.category[locale]}</span>
      </nav>
      {active.paths.length > 1 && <nav className="analysis-switch" aria-label={t('E-commerce analyses', 'Análisis de comercio electrónico')}>
        {active.paths.map(path => <Link key={path} href={path} aria-current={pathname.startsWith(path) ? 'page' : undefined}>{analysisName(path, locale)}</Link>)}
      </nav>}
    </div>}
    <div id="main-content" tabIndex={-1} className={active ? `project-content feature-${active.id}` : 'home-content'}>{children}</div>
    <footer className="site-footer">
      <div><strong>Andrés González Ortega</strong><p>{t('Actuarial science · UNAM · Mexico City', 'Actuaría · UNAM · Ciudad de México')}</p></div>
      <Link href="/">{t('All case studies', 'Todos los casos de estudio')}<ArrowUpRight size={14} aria-hidden="true" /></Link>
    </footer>
  </>
}
