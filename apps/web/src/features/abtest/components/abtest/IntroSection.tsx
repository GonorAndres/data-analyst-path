'use client'
import { usePreferences } from '@/components/SitePreferences'

export function IntroSection() {
  const { t } = usePreferences()
  return (
    <section className="mb-8 space-y-3">
      <p className="text-sm leading-relaxed text-[var(--fg-secondary)] max-w-3xl">
        {t('Should a redesigned landing page replace the existing one? Compare conversion, uncertainty and experiment quality before making a release decision.', '¿Debe una página rediseñada sustituir a la actual? Compara conversión, incertidumbre y calidad del experimento antes de decidir su lanzamiento.')}
      </p>
      <details className="glass-card p-4">
        <summary className="cursor-pointer font-medium">{t('Data and limitations', 'Datos y limitaciones')}</summary>
        <div className="mt-3 text-sm leading-relaxed text-[var(--fg-secondary)] space-y-3">
          <p>{t('The Udacity experiment covers January 2–24, 2017, with approximately 290,000 users randomly assigned to control (original page) or treatment (redesigned page). The pipeline removes mismatched page assignments.', 'El experimento de Udacity abarca del 2 al 24 de enero de 2017, con unos 290.000 usuarios asignados aleatoriamente al control (página original) o tratamiento (rediseño). El proceso de limpieza elimina asignaciones de página inconsistentes.')}</p>
          <p>{t('Device, browser, country, revenue and session fields are synthetic. Segment comparisons and revenue projections demonstrate analytical techniques; they are not evidence about real customer revenue. The short experiment does not measure long-term retention or novelty effects.', 'Los campos de dispositivo, navegador, país, ingresos y sesión son sintéticos. Las comparaciones por segmento y proyecciones de ingresos ilustran técnicas analíticas; no son evidencia de ingresos reales. El experimento breve no mide retención a largo plazo ni efectos de novedad.')}</p>
          <a className="underline underline-offset-2" href="https://www.kaggle.com/datasets/zhangluyuan/ab-testing" target="_blank" rel="noopener noreferrer">{t('Source dataset: Udacity / Kaggle', 'Datos originales: Udacity / Kaggle')}</a>
        </div>
      </details>
      <details className="glass-card p-4">
        <summary className="cursor-pointer font-medium">{t('How to interpret the analysis', 'Cómo interpretar el análisis')}</summary>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2 text-sm">
          {[
            [t('Conversion and lift', 'Conversión y variación'), t('Conversion is purchases divided by users. Relative lift is (treatment − control) / control.', 'La conversión es compras divididas entre usuarios. La variación relativa es (tratamiento − control) / control.')],
            [t('Statistical uncertainty', 'Incertidumbre estadística'), t('A p-value measures compatibility with the null hypothesis. A 95% confidence interval comes from a procedure that covers the true value in 95% of repeated samples; it is not a probability assigned to this particular interval.', 'El valor p mide la compatibilidad con la hipótesis nula. Un intervalo de confianza del 95% procede de un método que incluye el valor real en el 95% de muestras repetidas; no asigna una probabilidad a este intervalo concreto.')],
            [t('Bayesian inference', 'Inferencia bayesiana'), t('Posterior probabilities and credible intervals depend on the specified prior and model. Compare expected loss alongside the probability of improvement.', 'Las probabilidades posteriores e intervalos de credibilidad dependen de la distribución previa y el modelo. Compara la pérdida esperada junto con la probabilidad de mejora.')],
            [t('Power and monitoring', 'Potencia y seguimiento'), t('Power is the probability of detecting a specified real effect. Plan the minimum detectable effect and sample size in advance; repeated looks require sequential stopping boundaries.', 'La potencia es la probabilidad de detectar un efecto real especificado. Planifica el efecto mínimo detectable y el tamaño muestral; las revisiones repetidas requieren límites de parada secuenciales.')],
          ].map(([label, detail]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="mt-1 text-[var(--fg-secondary)]">{detail}</dd></div>)}
        </dl>
      </details>
    </section>
  )
}
