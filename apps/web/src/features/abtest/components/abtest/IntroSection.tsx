'use client'
import { usePreferences } from '@/components/SitePreferences'

export function IntroSection() {
  const { t } = usePreferences()
  return (
    <section className="mb-8 space-y-3">
      <p className="text-sm leading-relaxed text-[var(--fg-secondary)] max-w-3xl">
        {t('A modified-outcome experiment demonstration: compare conversion, uncertainty and segment checks to design a release decision. These simulated results do not justify a real rollout.', 'Demostración experimental con resultados modificados: compara conversión, incertidumbre y segmentos para diseñar una decisión de lanzamiento. Estos resultados simulados no justifican un despliegue real.')}
      </p>
      <details className="glass-card p-4">
        <summary className="cursor-pointer font-medium">{t('Data and limitations', 'Datos y limitaciones')}</summary>
        <div className="mt-3 text-sm leading-relaxed text-[var(--fg-secondary)] space-y-3">
          <p>{t('The Udacity experiment covers January 2–24, 2017, with approximately 290,000 users randomly assigned to control (original page) or treatment (redesigned page). The pipeline removes mismatched page assignments.', 'El experimento de Udacity abarca del 2 al 24 de enero de 2017, con unos 290.000 usuarios asignados aleatoriamente al control (página original) o tratamiento (rediseño). El proceso de limpieza elimina asignaciones de página inconsistentes.')}</p>
          <p>{t('The enrichment also overwrites conversion outcomes: 1.5% of eligible mobile-treatment non-converters are flipped to converters, then 8% of eligible returning-treatment converters are flipped back. These seeded probabilities apply to eligible subsets, not to the whole population.', 'El enriquecimiento también modifica la conversión: convierte al 1,5% de los no convertidos elegibles de tratamiento móvil y después revierte al 8% de los convertidos elegibles recurrentes del tratamiento. Estas probabilidades con semilla se aplican a subconjuntos elegibles, no a toda la población.')}</p>
          <p>{t('Device, browser, country, revenue and session fields are synthetic. Their comparisons illustrate techniques, not real customer behavior or causal effects. Aggregate and segment disagreement alone does not establish Simpson’s paradox; check directions within strata and their weights. The short experiment does not measure long-term retention.', 'Dispositivo, navegador, país, ingresos y sesión son sintéticos. Sus comparaciones ilustran técnicas, no comportamiento real ni efectos causales. Una discrepancia entre agregado y segmentos no demuestra por sí sola la paradoja de Simpson; revisa direcciones dentro de estratos y sus pesos. El experimento breve no mide retención a largo plazo.')}</p>
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
