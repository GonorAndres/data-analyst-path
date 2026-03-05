'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface DatasetInfoProps {
  source: { label: string; url: string }
  period: string
  records: string
  description: string
  limitations: string[]
}

export function DatasetInfo({ source, period, records, description, limitations }: DatasetInfoProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border dark:border-[#2a2a2a] rounded-lg mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 font-sans text-sm text-muted hover:text-ink dark:hover:text-[#F0EFEB] transition-colors cursor-pointer"
      >
        <span className="tracking-wide">Acerca de los datos</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border dark:border-[#2a2a2a]">
          <p className="font-sans text-sm text-muted leading-relaxed mt-4 mb-4 max-w-2xl">
            {description}
          </p>

          <div className="flex flex-wrap gap-x-8 gap-y-2 font-sans text-xs text-muted mb-4">
            <span>
              Fuente:{' '}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink dark:hover:text-[#F0EFEB] transition-colors"
              >
                {source.label}
              </a>
            </span>
            <span>Periodo: {period}</span>
            <span>Registros: {records}</span>
          </div>

          <div>
            <p className="font-sans text-xs text-muted font-medium mb-1">Limitaciones:</p>
            <ul className="list-disc list-inside space-y-1">
              {limitations.map((item, i) => (
                <li key={i} className="font-sans text-xs text-muted leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
