'use client'

interface Tab {
  key: string
  label: string
}

interface TabNavProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex gap-0 border-b border-ops-border">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              relative px-5 py-3 font-sans text-xs uppercase tracking-wide
              transition-colors duration-150 bg-transparent border-none cursor-pointer
              ${isActive
                ? 'text-ops-blue'
                : 'text-ops-text-muted hover:bg-ops-surface-hover hover:text-ops-text'
              }
            `}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-ops-blue glow-blue"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
