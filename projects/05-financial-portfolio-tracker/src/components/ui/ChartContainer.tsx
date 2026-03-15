interface ChartContainerProps {
  title?: string
  subtitle?: string
  insight?: string
  children: React.ReactNode
  className?: string
}

export function ChartContainer({ title, subtitle, insight, children, className = '' }: ChartContainerProps) {
  return (
    <div className={`glass-card p-6 mb-6 ${className}`}>
      {title && (
        <h2 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-ink mb-1">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="font-sans text-sm text-muted mb-4 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      {insight && (
        <p className="font-sans text-base leading-snug text-ink max-w-2xl mb-6">
          {insight}
        </p>
      )}
      <div className="w-full">{children}</div>
    </div>
  )
}
