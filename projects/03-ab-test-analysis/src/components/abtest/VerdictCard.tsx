'use client'
import { motion } from 'framer-motion'

interface VerdictCardProps {
  verdict: string
  pValue: number
  lift: number
  power: number
}

export function VerdictCard({ verdict, pValue, lift, power }: VerdictCardProps) {
  const config: Record<string, { bg: string; border: string; text: string; darkBg: string }> = {
    'SHIP IT': {
      bg: 'bg-green-50',
      border: 'border-sig-positive',
      text: 'text-sig-positive',
      darkBg: 'dark:bg-green-950/30',
    },
    "DON'T SHIP": {
      bg: 'bg-red-50',
      border: 'border-sig-negative',
      text: 'text-sig-negative',
      darkBg: 'dark:bg-red-950/30',
    },
    'NEEDS MORE DATA': {
      bg: 'bg-amber-50',
      border: 'border-sig-inconclusive',
      text: 'text-sig-inconclusive',
      darkBg: 'dark:bg-amber-950/30',
    },
  }

  const c = config[verdict] || config['NEEDS MORE DATA']

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`${c.bg} ${c.darkBg} border-2 ${c.border} rounded-lg p-6 md:p-8 text-center`}
    >
      <p className="font-sans text-xs tracking-widest uppercase text-muted mb-2">Experiment Verdict</p>
      <h2 className={`font-serif text-4xl md:text-5xl font-bold ${c.text} mb-4`}>
        {verdict}
      </h2>
      <div className="flex justify-center gap-8 font-sans text-sm text-muted">
        <span>p-value: <strong className="text-ink dark:text-[#F0EFEB]">{pValue.toFixed(4)}</strong></span>
        <span>Lift: <strong className="text-ink dark:text-[#F0EFEB]">{lift >= 0 ? '+' : ''}{lift.toFixed(2)}%</strong></span>
        <span>Power: <strong className="text-ink dark:text-[#F0EFEB]">{(power * 100).toFixed(1)}%</strong></span>
      </div>
    </motion.div>
  )
}
