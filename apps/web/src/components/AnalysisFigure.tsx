'use client'

import { useId, type ReactNode } from 'react'
import { ChartState } from './ChartState'
import { usePreferences } from './SitePreferences'
import styles from './AnalysisFigure.module.css'

export interface AnalysisFigureProps {
  title?: string
  subtitle?: string
  description?: string
  insight?: ReactNode
  source?: ReactNode
  children: ReactNode
  className?: string
  loading?: boolean
  error?: unknown
  empty?: boolean
  headingLevel?: 2 | 3
  scrollable?: boolean
}

/** Shared exploration figure: question, evidence, interpretation, provenance. */
export function AnalysisFigure({
  title, subtitle, description, insight, source, children, className = '',
  loading, error, empty, headingLevel = 2, scrollable = false,
}: AnalysisFigureProps) {
  const id = useId()
  const { t } = usePreferences()
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const ready = !loading && !error && !empty
  const hasCaption = ready && (insight || source)

  return (
    <figure
      className={`${styles.figure} ${className}`}
      aria-labelledby={title ? `${id}-title` : undefined}
      aria-busy={loading || undefined}
    >
      {(title || subtitle || description) && (
        <div className={styles.heading}>
          {title && <Heading id={`${id}-title`} className={styles.title}>{title}</Heading>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {description && description !== subtitle && <p className={styles.description}>{description}</p>}
        </div>
      )}
      <div className={`${styles.canvas} ${scrollable ? styles.scrollable : ''}`}>
        <ChartState loading={loading} error={error} empty={empty}>{children}</ChartState>
      </div>
      {hasCaption && (
        <figcaption className={styles.caption}>
          {insight && <div className={styles.insight}>{insight}</div>}
          {source && <div className={styles.source}><span>{t('Source', 'Fuente')}: </span>{source}</div>}
        </figcaption>
      )}
    </figure>
  )
}
