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
      <div className="flex gap-0 min-w-max border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-5 py-3 font-sans text-sm tracking-wide transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? 'text-accent font-semibold'
                : 'text-muted hover:text-ink'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent shadow-[0_0_8px_rgba(155,125,200,0.4)]" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
