'use client'
import { usePreferences } from '@/components/SitePreferences'

export function AboutPanel() {
  const { t } = usePreferences()
  const sections = [
    [t('Business question', 'Pregunta de negocio'), t('Does a diversified ETF portfolio deliver enough return for the risk it takes? Compare performance with SPY, identify concentrations and explore alternative allocations.', '¿Un portafolio diversificado de ETFs genera suficiente rendimiento para el riesgo que asume? Compara su desempeño con SPY, identifica concentraciones y explora asignaciones alternativas.')],
    [t('Data and assumptions', 'Datos y supuestos'), t('Yahoo Finance market history via yfinance. The model portfolio allocates 30% VOO, 20% VXUS, 10% VWO, 20% BND, 10% VNQ and 10% GLD. Select a period to recalculate the analysis.', 'Historial de mercado de Yahoo Finance mediante yfinance. El portafolio modelo asigna 30% VOO, 20% VXUS, 10% VWO, 20% BND, 10% VNQ y 10% GLD. Selecciona un periodo para recalcular el análisis.')],
    [t('How to explore', 'Cómo explorar'), t('Start with Overview for allocation and benchmark results. Performance explains returns and drawdowns; Risk and Correlation examine exposure. Monte Carlo explores possible outcomes and Frontier compares optimized weights.', 'Comienza en Resumen para consultar la asignación y comparación con el índice. Rendimiento explica retornos y caídas; Riesgo y Correlación examinan la exposición. Monte Carlo explora resultados posibles y Frontera compara pesos optimizados.')],
    [t('Interpretation', 'Interpretación'), t('Historical returns and model simulations describe assumptions, not guaranteed future outcomes. Sharpe measures excess return per unit of volatility. Drawdown measures the decline from a previous peak. Methodology includes the reproducible notebooks.', 'Los rendimientos históricos y las simulaciones describen supuestos, no garantizan resultados futuros. Sharpe mide el rendimiento excedente por unidad de volatilidad. La caída máxima mide el descenso desde un máximo previo. Metodología incluye los notebooks reproducibles.')],
  ]
  return <div className="grid gap-4 md:grid-cols-2">{sections.map(([title, body]) => <section key={title} className="glass-card p-6"><h2 className="text-lg font-semibold text-ink mb-3">{title}</h2><p className="text-sm text-muted leading-relaxed">{body}</p></section>)}</div>
}
