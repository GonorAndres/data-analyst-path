'use client'

interface Tab {
  id: string
  label: string
}

interface TabNavProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="mb-8 overflow-x-auto">
      <div className="flex gap-1.5 min-w-max p-1 glass-card">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-accent-cyan/20 text-[var(--accent-cyan)] shadow-sm shadow-accent-cyan/10 border border-accent-cyan/30'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--glass-bg)]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
