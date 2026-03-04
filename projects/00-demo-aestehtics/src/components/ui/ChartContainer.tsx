interface ChartContainerProps {
  title?: string
  subtitle?: string
  insight: string
  children: React.ReactNode
  className?: string
}

export function ChartContainer({ title, subtitle, insight, children, className = '' }: ChartContainerProps) {
  return (
    <div className={`py-10 border-t border-border dark:border-[#2a2a2a] ${className}`}>
      {title && (
        <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-ink dark:text-[#F0EFEB] mb-2">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="font-sans text-sm text-muted mb-6 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      <p className="font-sans text-base leading-snug text-ink dark:text-[#F0EFEB] max-w-2xl mb-8">
        {insight}
      </p>
      <div className="w-full">{children}</div>
    </div>
  )
}
