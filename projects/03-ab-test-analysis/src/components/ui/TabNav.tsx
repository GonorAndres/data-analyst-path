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
    <nav className="border-b border-border dark:border-[#2a2a2a] mb-8 overflow-x-auto">
      <div className="flex gap-0 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-3 font-sans text-sm tracking-wide transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-b-2 border-accent-indigo dark:border-[#818CF8] text-accent-indigo dark:text-[#818CF8] font-semibold'
                : 'text-muted hover:text-ink dark:hover:text-[#F0EFEB]'
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
