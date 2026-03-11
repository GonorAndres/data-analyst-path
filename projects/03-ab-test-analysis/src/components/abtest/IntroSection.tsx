'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border dark:border-[#2a2a2a] rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 font-sans text-sm text-muted hover:text-ink dark:hover:text-[#F0EFEB] transition-colors cursor-pointer"
      >
        <span className="tracking-wide">{title}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border dark:border-[#2a2a2a]">
          {children}
        </div>
      )}
    </div>
  )
}

function ControlLabel() {
  return <span className="font-semibold" style={{ color: 'var(--control)' }}>Control</span>
}

function TreatmentLabel() {
  return <span className="font-semibold" style={{ color: 'var(--treatment)' }}>Treatment</span>
}

export function IntroSection() {
  return (
    <section className="mb-8">
      {/* Hero context */}
      <div className="bg-surface dark:bg-[#1a1a1a] rounded-lg p-5 mb-4">
        <p className="font-sans text-sm leading-relaxed text-ink dark:text-[#F0EFEB] max-w-3xl">
          An e-commerce company redesigned its landing page and ran a controlled experiment on
          ~290K users to decide whether to ship it. This dashboard walks through the statistical
          analysis, from classical hypothesis testing to Bayesian inference, to reach a
          data-driven decision.
        </p>
      </div>

      <div className="space-y-3">
        {/* Dataset Info */}
        <Accordion title="About the Data">
          <p className="font-sans text-sm text-muted leading-relaxed mt-4 mb-4 max-w-2xl">
            Users were randomly assigned to see either the old landing page (<ControlLabel /> group)
            or the new design (<TreatmentLabel /> group). The primary outcome is whether each user
            converted (made a purchase). Secondary metrics include revenue per user and session
            duration.
          </p>

          <div className="flex flex-wrap gap-x-8 gap-y-2 font-sans text-xs text-muted mb-4">
            <span>
              Source:{' '}
              <a
                href="https://www.kaggle.com/datasets/zhangluyuan/ab-testing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink dark:hover:text-[#F0EFEB] transition-colors"
              >
                Udacity / Kaggle A/B Test Dataset
              </a>{' '}
              + synthetic enrichment
            </span>
            <span>Period: Jan 2-24, 2017</span>
            <span>Records: 290,584 users (~145K per group)</span>
          </div>

          <div>
            <p className="font-sans text-xs text-muted font-medium mb-1">Limitations:</p>
            <ul className="list-disc list-inside space-y-1">
              <li className="font-sans text-xs text-muted leading-relaxed">
                Device, browser, country, revenue, and session columns are synthetically generated; they illustrate segmentation techniques but are not real user data.
              </li>
              <li className="font-sans text-xs text-muted leading-relaxed">
                Single binary outcome (converted / not converted). No funnel stages or long-term retention.
              </li>
              <li className="font-sans text-xs text-muted leading-relaxed">
                Original dataset contains ~3,893 mismatched rows (control users who saw the new page and vice versa). These are cleaned in the data pipeline.
              </li>
              <li className="font-sans text-xs text-muted leading-relaxed">
                22-day experiment window. No measurement of novelty effects or long-term behavior changes.
              </li>
            </ul>
          </div>
        </Accordion>

        {/* What is A/B Testing? */}
        <Accordion title="What is A/B Testing?">
          <div className="mt-4 space-y-4 font-sans text-sm text-muted leading-relaxed max-w-3xl">
            <p>
              A/B testing is a controlled experiment that compares two versions of something to
              determine which performs better. Users are randomly split into two groups:
            </p>

            {/* Visual diagram */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 my-4">
              <div className="flex-1 rounded-lg p-4 border-2" style={{ borderColor: 'var(--control)', backgroundColor: 'color-mix(in srgb, var(--control) 8%, transparent)' }}>
                <p className="font-semibold text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--control)' }}>
                  Group A: Control
                </p>
                <p className="text-xs text-muted">
                  Sees the existing landing page. Serves as the baseline for comparison.
                </p>
              </div>
              <div className="flex items-center justify-center text-muted text-xs font-sans">
                vs
              </div>
              <div className="flex-1 rounded-lg p-4 border-2" style={{ borderColor: 'var(--treatment)', backgroundColor: 'color-mix(in srgb, var(--treatment) 8%, transparent)' }}>
                <p className="font-semibold text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--treatment)' }}>
                  Group B: Treatment
                </p>
                <p className="text-xs text-muted">
                  Sees the redesigned landing page. We measure if this performs better.
                </p>
              </div>
            </div>

            <p>
              <strong className="text-ink dark:text-[#F0EFEB]">Randomization</strong> ensures both groups are
              comparable, so any difference in outcomes can be attributed to the page change, not to
              pre-existing differences between users.
            </p>
            <p>
              <strong className="text-ink dark:text-[#F0EFEB]">Statistical significance</strong> tells us
              whether the observed difference is likely real or just due to random chance. A result
              is &quot;statistically significant&quot; when we are confident enough (typically 95%)
              that the difference would persist if we repeated the experiment.
            </p>
          </div>
        </Accordion>

        {/* How to Read This Dashboard */}
        <Accordion title="How to Read This Dashboard">
          <div className="mt-4 space-y-3 font-sans text-sm text-muted leading-relaxed max-w-3xl">
            <div>
              <p className="font-medium text-ink dark:text-[#F0EFEB]">Executive Overview</p>
              <p>The verdict: should we ship the new page? Headline KPIs, revenue projections, and test health checks.</p>
            </div>
            <div>
              <p className="font-medium text-ink dark:text-[#F0EFEB]">Frequentist Analysis</p>
              <p>Classical hypothesis testing: p-values, confidence intervals, and effect sizes. The standard approach most data teams use.</p>
            </div>
            <div>
              <p className="font-medium text-ink dark:text-[#F0EFEB]">Bayesian Analysis</p>
              <p>Probability-based reasoning: what is the chance that the treatment is actually better? Posterior distributions and expected loss.</p>
            </div>
            <div>
              <p className="font-medium text-ink dark:text-[#F0EFEB]">Segments</p>
              <p>Does the treatment work differently for mobile vs desktop? New vs returning users? Segment-level effects and Simpson&apos;s Paradox.</p>
            </div>
            <div>
              <p className="font-medium text-ink dark:text-[#F0EFEB]">Power & Design</p>
              <p>Was the experiment large enough to detect the effect? Interactive calculator for sample size planning.</p>
            </div>
            <div>
              <p className="font-medium text-ink dark:text-[#F0EFEB]">Sequential Monitoring</p>
              <p>What if we peeked at results during the experiment? Stopping boundaries and the multiple testing problem.</p>
            </div>
          </div>
        </Accordion>

        {/* Key Definitions */}
        <Accordion title="Key Definitions">
          <dl className="mt-4 space-y-3 font-sans text-sm max-w-3xl">
            <div>
              <dt className="font-medium text-ink dark:text-[#F0EFEB]">Conversion Rate</dt>
              <dd className="text-muted leading-relaxed">Percentage of users who completed the desired action (purchase). Calculated as conversions / total users.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink dark:text-[#F0EFEB]">Lift</dt>
              <dd className="text-muted leading-relaxed">Relative difference between treatment and control conversion rates: (treatment - control) / control, expressed as a percentage.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink dark:text-[#F0EFEB]">P-value</dt>
              <dd className="text-muted leading-relaxed">The probability of seeing a difference this large (or larger) if the treatment had no real effect. Below 0.05 is conventionally considered &quot;significant.&quot;</dd>
            </div>
            <div>
              <dt className="font-medium text-ink dark:text-[#F0EFEB]">Confidence Interval (CI)</dt>
              <dd className="text-muted leading-relaxed">A range that, with 95% confidence, contains the true difference between groups. If the CI excludes zero, the result is significant.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink dark:text-[#F0EFEB]">Statistical Power</dt>
              <dd className="text-muted leading-relaxed">The probability that the experiment detects a real effect when one exists. Standard target is 80%. Low power means the test may miss real improvements.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink dark:text-[#F0EFEB]">Minimum Detectable Effect (MDE)</dt>
              <dd className="text-muted leading-relaxed">The smallest effect size the experiment is designed to reliably detect, given the sample size and desired power.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink dark:text-[#F0EFEB]">Simpson&apos;s Paradox</dt>
              <dd className="text-muted leading-relaxed">When a trend that appears in aggregate data reverses when data is split into subgroups. Example: the treatment might lose overall but win in every device category.</dd>
            </div>
          </dl>
        </Accordion>
      </div>
    </section>
  )
}
