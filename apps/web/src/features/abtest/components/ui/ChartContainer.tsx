interface ChartContainerProps {
  title?: string
  subtitle?: string
  insight: string
  children: React.ReactNode
  className?: string
}

export function ChartContainer({ title, subtitle, insight, children, className = '' }: ChartContainerProps) {
  return (
    <div className={`py-6 border-t border-border dark:border-[var(--border)] ${className}`}>
      {title && (
        <h2 className="font-sans text-xl md:text-2xl tracking-tight text-ink dark:text-[var(--foreground)] mb-2">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="font-sans text-sm text-muted mb-6 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      <p className="font-sans text-base leading-snug text-ink dark:text-[var(--foreground)] max-w-2xl mb-8">
        {insight}
      </p>
      <div className="w-full min-w-0">{children}</div>
    </div>
  )
}
