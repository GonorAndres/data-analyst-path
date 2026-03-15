'use client'
import { BookOpen, Database, BarChart3, Target, Lightbulb, Layout, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-[var(--accent-cyan)]">{icon}</span>
        <h3 className="text-base font-semibold text-[var(--fg-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function TabGuide({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--glass-border)] last:border-b-0">
      <ArrowRight size={14} className="text-[var(--accent-cyan)] mt-0.5 shrink-0" />
      <div>
        <span className="text-sm font-medium text-[var(--fg-primary)]">{name}</span>
        <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export function IntroSection() {
  const { t } = useLanguage()

  return (
    <section className="space-y-6">
      {/* Hero */}
      <div className="glass-card p-8">
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[var(--accent-cyan)] mb-3">
          {t('about.project_label')}
        </p>
        <h2 className="text-2xl md:text-3xl font-light text-[var(--fg-primary)] mb-4 leading-snug max-w-2xl">
          {t('about.hero_title')}
        </h2>
        <p className="text-sm text-[var(--fg-secondary)] leading-relaxed max-w-3xl">
          {t('about.hero_desc')}
        </p>
      </div>

      {/* Two-column: What & Why */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard icon={<Target size={18} />} title={t('about.what_title')}>
          <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-4">
            {t('about.what_desc')}
          </p>
          <div className="space-y-2">
            {['about.what_bullet_1', 'about.what_bullet_2', 'about.what_bullet_3', 'about.what_bullet_4'].map((key) => (
              <div key={key} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] mt-1.5 shrink-0" />
                <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{t(key as any)}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={<Lightbulb size={18} />} title={t('about.why_title')}>
          <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-4">
            {t('about.why_desc')}
          </p>
          <div className="space-y-2">
            {['about.why_bullet_1', 'about.why_bullet_2', 'about.why_bullet_3'].map((key) => (
              <div key={key} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)] mt-1.5 shrink-0" />
                <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{t(key as any)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Data Source */}
      <SectionCard icon={<Database size={18} />} title={t('about.data_title')}>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-4">
          {t('about.data_desc')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('about.data_company'), value: 'NovaCRM' },
            { label: t('about.data_type'), value: t('about.data_type_val') },
            { label: t('about.data_period'), value: 'Jan 2024 -- Dec 2025' },
            { label: t('about.data_granularity'), value: t('about.data_granularity_val') },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--fg-muted)] mb-1">{item.label}</p>
              <p className="text-sm text-[var(--fg-primary)]">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed mt-4">
          {t('about.data_why_synthetic')}
        </p>
      </SectionCard>

      {/* Methodology */}
      <SectionCard icon={<BarChart3 size={18} />} title={t('about.method_title')}>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-4">
          {t('about.method_desc')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[var(--accent-cyan)]/5 border border-[var(--accent-cyan)]/10">
            <p className="text-xs font-semibold text-[var(--accent-cyan)] mb-2">{t('about.method_kpi_title')}</p>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{t('about.method_kpi_desc')}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--accent-violet)]/5 border border-[var(--accent-violet)]/10">
            <p className="text-xs font-semibold text-[var(--accent-violet)] mb-2">{t('about.method_anomaly_title')}</p>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{t('about.method_anomaly_desc')}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--status-green)]/5 border border-[var(--status-green)]/10">
            <p className="text-xs font-semibold text-[var(--status-green)] mb-2">{t('about.method_forecast_title')}</p>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{t('about.method_forecast_desc')}</p>
          </div>
        </div>
      </SectionCard>

      {/* How to navigate */}
      <SectionCard icon={<Layout size={18} />} title={t('about.guide_title')}>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-4">
          {t('about.guide_desc')}
        </p>
        <div className="divide-y divide-[var(--glass-border)]">
          <TabGuide name={t('nav.overview')} desc={t('about.guide_overview')} />
          <TabGuide name={t('nav.revenue')} desc={t('about.guide_revenue')} />
          <TabGuide name={t('nav.customers')} desc={t('about.guide_customers')} />
          <TabGuide name={t('nav.forecast')} desc={t('about.guide_forecast')} />
          <TabGuide name={t('nav.anomalies')} desc={t('about.guide_anomalies')} />
          <TabGuide name={t('nav.report')} desc={t('about.guide_report')} />
          <TabGuide name={t('nav.technical')} desc={t('about.guide_technical')} />
        </div>
      </SectionCard>

      {/* Lessons & Learnings */}
      <SectionCard icon={<BookOpen size={18} />} title={t('about.lessons_title')}>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-4">
          {t('about.lessons_desc')}
        </p>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] text-xs font-semibold shrink-0 mt-0.5">
                {n}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--fg-primary)]">{t(`about.lesson_${n}_title` as any)}</p>
                <p className="text-xs text-[var(--fg-muted)] leading-relaxed mt-0.5">{t(`about.lesson_${n}_desc` as any)}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Tech Stack */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-[var(--fg-primary)] mb-4">{t('about.stack_title')}</h3>
        <div className="flex flex-wrap gap-2">
          {['Next.js 14', 'FastAPI', 'Python', 'TypeScript', 'Tailwind CSS', 'Recharts', 'pandas', 'statsmodels', 'fpdf2', 'Plotly', 'SWR', 'Framer Motion'].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-xs rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--fg-muted)]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
