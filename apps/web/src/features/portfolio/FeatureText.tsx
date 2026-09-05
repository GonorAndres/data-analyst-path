'use client'
import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react'
import { usePreferences } from '@/components/SitePreferences'

// Localize presentation strings in legacy chart components without changing
// identifiers, URLs, data keys, callback arguments or the underlying datasets.
const pairs = `Loading correlation data...|Cargando correlaciones...
Failed to load correlation data.|No se pudieron cargar las correlaciones.
Diversification Ratio|Ratio de diversificación
Measures how much diversification reduces risk. Above 1.0 means it is working.|Mide cuánto reduce el riesgo la diversificación. Un valor superior a 1 indica un beneficio.
Values above 1.0 indicate the portfolio benefits from diversification. Higher is better -- it means assets are not perfectly correlated.|Un valor superior a 1 indica beneficios de diversificación: los activos no están perfectamente correlacionados.
Correlation Matrix|Matriz de correlación
Pairwise correlations between all assets in the portfolio. Red = high positive, Green = negative.|Correlaciones entre los activos del portafolio. Rojo = positiva alta; verde = negativa.
Rolling Correlation|Correlación móvil
60-day rolling correlation of each asset against the overall portfolio.|Correlación móvil de 60 días de cada activo con el portafolio completo.
Return:|Rendimiento:
Risk:|Riesgo:
Computing efficient frontier...|Calculando la frontera eficiente...
Failed to load frontier data.|No se pudo cargar la frontera eficiente.
Current|Actual
Min Var|Mín. varianza
Max Sharpe|Máx. Sharpe
Efficient Frontier|Frontera eficiente
Each dot is a simulated portfolio. The frontier curve shows the maximum return achievable at each risk level.|Cada punto es un portafolio simulado. La frontera muestra el rendimiento máximo para cada nivel de riesgo.
Risk|Riesgo
Return|Rendimiento
Random Portfolios|Portafolios aleatorios
Current Portfolio|Portafolio actual
Min Variance|Mínima varianza
Sharpe Ratio:|Ratio de Sharpe:
Optimal vs Current Weights|Pesos óptimos frente a actuales
How the maximum-Sharpe portfolio differs from your current allocation.|Diferencias entre el portafolio de máximo Sharpe y la asignación actual.
Optimal (Max Sharpe)|Óptimo (máx. Sharpe)
Key Portfolio Points|Portafolios de referencia
Comparison of the current, minimum variance, and maximum Sharpe portfolios.|Comparación del portafolio actual, de mínima varianza y de máximo Sharpe.
Portfolio|Portafolio
01. Data Acquisition|01. Adquisición de datos
Fetching market data via yfinance, quality checks, gap and split handling, parquet caching.|Datos de mercado con yfinance, controles de calidad, tratamiento de huecos y splits, y caché parquet.
02. Portfolio Construction|02. Construcción del portafolio
Defining asset allocation, computing weighted returns, benchmark comparison, and rebalancing strategies.|Asignación de activos, rendimientos ponderados, comparación con el índice y estrategias de rebalanceo.
03. Performance Analysis|03. Análisis de rendimiento
Cumulative returns, drawdown analysis, rolling windows, calendar heatmap, and return attribution.|Rendimientos acumulados, análisis de caídas, ventanas móviles, mapa mensual y atribución.
04. Risk Analytics|04. Analítica de riesgo
Value at Risk (3 methods), CVaR, Sharpe/Sortino/Calmar ratios, beta/alpha, and volatility regimes.|Valor en riesgo (3 métodos), CVaR, ratios Sharpe/Sortino/Calmar, beta/alfa y regímenes de volatilidad.
05. Monte Carlo & Frontier|05. Monte Carlo y frontera
GBM simulation with Ito's lemma derivation, fan charts, efficient frontier optimization, and optimal portfolios.|Simulación GBM con el lema de Itô, abanicos de escenarios, frontera eficiente y portafolios óptimos.
Loading notebook...|Cargando notebook...
Notebook HTML not yet generated.|El notebook no está disponible.
Horizon (Days)|Horizonte (días)
days (|días (
y)|años)
Simulations|Simulaciones
Initial Value|Valor inicial
Target Return (%)|Rendimiento objetivo (%)
Running Monte Carlo simulation...|Ejecutando simulación Monte Carlo...
Failed to run simulation.|No se pudo ejecutar la simulación.
P(Profit)|P(Ganancia)
Probability that the portfolio ends above its starting value.|Probabilidad de que el portafolio termine por encima de su valor inicial.
P(Target)|P(Objetivo)
Probability of reaching the target return you set.|Probabilidad de alcanzar el rendimiento objetivo seleccionado.
Median Final Value|Mediana del valor final
The middle outcome across all simulations, 50% chance of doing better or worse.|Resultado central de las simulaciones: la mitad termina por encima y la mitad por debajo.
5th Pctl (Worst Case)|Percentil 5 (cola inferior)
Only 5% of simulations ended below this value.|Solo el 5% de las simulaciones terminó por debajo de este valor.
Simulation Fan Chart|Abanico de simulación
Percentile bands showing the range of possible portfolio values over the simulation horizon.|Bandas de percentiles que muestran los valores posibles durante el horizonte de simulación.
95th Pctl|Percentil 95
75th Pctl|Percentil 75
Median|Mediana
25th Pctl|Percentil 25
5th Pctl|Percentil 5
Final Value Statistics|Estadísticas del valor final
Summary statistics of simulated portfolio values at the end of the horizon.|Resumen de los valores simulados del portafolio al final del horizonte.
Statistic|Estadística
Value|Valor
Mean|Media
Std Dev|Desv. estándar
5th Percentile|Percentil 5
25th Percentile|Percentil 25
75th Percentile|Percentil 75
95th Percentile|Percentil 95
Min|Mín.
Max|Máx.
Loading portfolio overview...|Cargando resumen del portafolio...
Failed to load portfolio data.|No se pudieron cargar los datos del portafolio.
Total Return|Rendimiento total
How much the portfolio gained or lost since inception, as a percentage.|Ganancia o pérdida porcentual del portafolio desde el inicio.
YTD Return|Rendimiento del año
Year-to-date gain or loss since January 1st.|Ganancia o pérdida acumulada desde el 1 de enero.
Sharpe Ratio|Ratio de Sharpe
Return earned per unit of risk. Above 1.0 is good, above 2.0 is excellent.|Rendimiento por unidad de riesgo; valores mayores indican mejor rendimiento ajustado por volatilidad.
Max Drawdown|Caída máxima
Largest drop from peak to trough. Shows worst-case historical loss.|Mayor caída desde un máximo hasta el mínimo posterior: la peor pérdida histórica observada.
Portfolio Value|Valor del portafolio
Current total value of all holdings.|Valor total actual de las posiciones.
vs Benchmark|Frente al índice
How much the portfolio outperformed (+) or underperformed (-) the S&P 500.|Cuánto superó (+) o quedó por debajo (-) del S&P 500 el portafolio.
Asset Allocation|Asignación de activos
Current portfolio weight distribution across asset categories.|Distribución de los pesos actuales entre categorías de activos.
Portfolio vs Benchmark|Portafolio frente al índice
Key metrics comparison over the selected period.|Comparación de métricas durante el periodo seleccionado.
Metric|Métrica
Ann. Return|Rendimiento anualizado
Ann. Volatility|Volatilidad anualizada
Last updated:|Última actualización:
Loading performance data...|Cargando rendimientos...
Failed to load performance data.|No se pudieron cargar los rendimientos.
Cumulative Returns|Rendimientos acumulados
Growth of a $1 investment in each asset and the overall portfolio.|Crecimiento de una inversión de $1 en cada activo y en el portafolio.
Benchmark|Índice de referencia
Drawdowns|Caídas desde máximos
Peak-to-trough declines. The deeper the drawdown, the longer it typically takes to recover.|Descensos desde máximos. Las caídas más profundas suelen requerir más tiempo de recuperación.
Monthly Returns|Rendimientos mensuales
Calendar heatmap of monthly portfolio returns. Green = positive, Red = negative.|Mapa de rendimientos mensuales. Verde = positivo; rojo = negativo.
Year|Año
YTD|Acumulado anual
Rolling Returns|Rendimientos móviles
Rolling total returns over different window lengths.|Rendimientos totales móviles para distintas ventanas.
Loading risk metrics...|Cargando métricas de riesgo...
Failed to load risk data.|No se pudieron cargar los datos de riesgo.
Parametric|Paramétrico
Historical|Histórico
(Ann. Return - Rf) / Ann. Volatility|(Rendimiento anualizado - Rf) / Volatilidad anualizada
Sortino Ratio|Ratio de Sortino
Uses downside deviation only|Usa solo la desviación a la baja
Calmar Ratio|Ratio de Calmar
Ann. Return / |Max Drawdown||Rendimiento anualizado / caída máxima absoluta
Sensitivity to benchmark|Sensibilidad al índice
Alpha|Alfa
Jensen's alpha (annualized %)|Alfa de Jensen (% anualizado)
Tracking Error|Error de seguimiento
Std of excess returns (annualized %)|Desviación del rendimiento excedente (% anualizado)
Information Ratio|Ratio de información
Excess return / Tracking error|Rendimiento excedente / error de seguimiento
Value at Risk (95%)|Valor en riesgo (95%)
Comparison of VaR estimates using parametric, historical, and Monte Carlo methods.|Comparación del VaR paramétrico, histórico y por Monte Carlo.
Risk-Adjusted Ratios|Ratios ajustados por riesgo
Key metrics that measure return per unit of risk taken.|Métricas de rendimiento por unidad de riesgo asumido.
Description|Descripción
Return Distribution|Distribución de rendimientos
Rolling Volatility (30-day)|Volatilidad móvil (30 días)
Annualized rolling standard deviation of portfolio returns.|Desviación estándar móvil anualizada de los rendimientos.
US Equity|Renta variable de EE. UU.
International Equity|Renta variable internacional
Emerging Markets|Mercados emergentes
Fixed Income|Renta fija
Real Estate|Bienes raíces
Commodities|Materias primas
Failed to load agency performance.|Error al cargar datos de rendimiento por agencia.
Volume ranking|Ranking por Volumen
Requests by agency (top 15)|Solicitudes por agencia (top 15)
SLA compliance|Cumplimiento SLA
Top 3 agencies by volume|Top 3 agencias por volumen
avg. days|d prom.
Heatmap|Mapa de Calor
Agency × complaint type (request volume)|Agencia x Tipo de queja (volumen de solicitudes)
Failed to load geographic data.|Error al cargar datos geograficos.
Requests by borough|Solicitudes por Municipio
Select a borough to filter|Haz clic en un municipio para filtrar
No map data.|Sin datos de mapa.
Borough comparison|Comparativa por Municipio
Borough|Municipio
Requests|Solicitudes
Avg. days|Dias Prom.
Top complaint|Top Queja
No borough data.|Sin datos de municipios.
Total requests|Total Solicitudes
Average resolution|Resolucion Promedio
Closure rate|Tasa de Cierre
Primary channel|Canal Principal
Open requests|Solicitudes Abiertas
Context|Contexto
Executive overview|Resumen Ejecutivo
Process flow|Flujo de Procesos
Agency performance|Rendimiento por Agencia
Geographic analysis|Analisis Geografico
Trends and seasonality|Tendencias y Estacionalidad
Pareto and priorities|Pareto y Prioridades
Technical process|Proceso Tecnico
All agencies|Todas las agencias
All complaint types|Todos los tipos
All boroughs|Todos los municipios
All channels|Todos los canales
All periods|Todos los periodos
Reset filters|Limpiar filtros
Failed to load executive overview.|Error al cargar el resumen ejecutivo.
Leading complaint types|Tipos de Queja Principales
Failed to load Pareto data.|Error al cargar datos de Pareto.
Pareto analysis|Analisis de Pareto
Complaint types by volume and cumulative share|Tipos de queja por volumen y acumulado
80/20 rule:|Regla 80/20:
The|El
% of complaint types generate at least 80% of total volume.|% de tipos de queja genera al menos el 80% del volumen total.
No Pareto data.|Sin datos de Pareto.
Priority matrix|Matriz de Prioridades
Volume vs. resolution time, colored by SLA|Volumen vs. tiempo de resolucion, color por SLA
01 — Ingestion and cleaning|01 -- Ingesta y Limpieza
Download NYC 311 data through Socrata; clean missing values and invalid dates; standardize agency and borough names.|Descarga de datos NYC 311 via Socrata API, limpieza de nulos y fechas invalidas, estandarizacion de nombres de agencias y municipios.
Raw CSV (~3.5M rows) → clean parquet (~3.2M rows)|CSV crudo (~3.5M filas) -> parquet limpio (~3.2M filas)
02 — Exploratory analysis|02 -- Analisis Exploratorio (EDA)
Resolution-time distributions, agency and borough volumes, temporal patterns and data quality.|Distribuciones de tiempos de resolucion, volumen por agencia/municipio, patrones temporales, calidad de datos.
13 interactive visualizations and documented findings|13 visualizaciones interactivas, hallazgos clave documentados
03 — SLA compliance analysis|03 -- Analisis de Cumplimiento SLA
Agency SLA compliance, statistical comparisons against the city average and confidence intervals.|Calculo de cumplimiento SLA por agencia, pruebas estadisticas vs promedio ciudad, intervalos de confianza.
Statistical significance table and logistic model|Tabla de significancia estadistica, modelo logistico
04 — Process mining|04 -- Mineria de Procesos
Build Sankey process flows, identify bottlenecks, analyze Pareto concentration and develop recommendations.|Construccion del flujo de procesos (Sankey), deteccion de cuellos de botella, analisis Pareto, recomendaciones.
Sankey data, priority ranking and executive summary|Datos Sankey, ranking de prioridades, resumen ejecutivo
of|de
Previous|Anterior
Next|Siguiente
Outputs:|Salidas:
Failed to load process-flow data.|Error al cargar datos de flujo de procesos.
Complaint category → Agency → Stage → Outcome|Categoria de queja -> Agencia -> Etapa -> Resultado
No process-flow data.|Sin datos de flujo disponibles.
Bottlenecks|Cuellos de Botella
Agencies with the longest resolution times|Agencias con mayor tiempo de resolucion
Agency|Agencia
Complaint type|Tipo de Queja
Median days|Dias Med.
No bottleneck data.|Sin datos de cuellos de botella.
SLA verdict|Veredicto SLA
Compliance|Cumplimiento
Avg. resolution|Resolucion Prom.
Failed to load trend data.|Error al cargar datos de tendencias.
Monthly trend|Tendencia Mensual
Request volume and average resolution time|Volumen de solicitudes y tiempo de resolucion promedio
Peak requests:|Pico de solicitudes:
with|con
requests|solicitudes
No monthly data.|Sin datos mensuales.
Seasonality|Estacionalidad
Heatmap: day of week × hour of day|Mapa de calor: dia de la semana x hora del dia
Meets target|CUMPLE
At risk|EN RIESGO
Below target|NO CUMPLE
No data available.|No hay datos disponibles.
Monday|Lunes
Tuesday|Martes
Wednesday|Miercoles
Thursday|Jueves
Friday|Viernes
Saturday|Sabado
Sunday|Domingo
Volume:|Volumen:
Count:|Cantidad:
Cumulative:|Acumulado:
days|dias
Data quality|Calidad de datos
Parquet storage|Almacenamiento parquet
Weighted returns|Rendimientos ponderados
Benchmark tracking|Seguimiento del índice
Rebalancing|Rebalanceo
Tracking error|Error de seguimiento
Rolling returns|Rendimientos móviles
Attribution|Atribución
Parametric VaR|VaR paramétrico
Historical VaR|VaR histórico
Monte Carlo VaR|VaR Monte Carlo
Risk-adjusted ratios|Ratios ajustados por riesgo
Efficient frontier|Frontera eficiente
Portfolio optimization|Optimización del portafolio`.split('\n').map(line => { const i = line.lastIndexOf('|'); return [line.slice(0, i), line.slice(i + 1)] as const })

const en = new Map(pairs.map(([a, b]) => [b, a]))
const es = new Map(pairs)
const extraPairs = [
  ['Trading Days', 'Días de negociación'],
  ['Annualized Risk (Std Dev)', 'Riesgo anualizado (desv. estándar)'],
  ['Annualized Return', 'Rendimiento anualizado'],
  ['Jan', 'Ene'], ['Apr', 'Abr'], ['Aug', 'Ago'], ['Dec', 'Dic'], ['1Y', '1A'],
  ['Resolution days', 'Días de resolución'],
  ['Average resolution days', 'Días de resolución promedio'],
  ['Average resolution', 'Resolución promedio'],
  ['Avg. resolution', 'Resolución prom.'],
  ['Avg. days', 'Días prom.'], ['Median days', 'Días med.'],
  ['Geographic analysis', 'Análisis geográfico'],
  ['Technical process', 'Proceso técnico'],
  ['Pareto analysis', 'Análisis de Pareto'],
  ['Request volume and average resolution time', 'Volumen de solicitudes y tiempo de resolución promedio'],
  ['Volume vs. resolution time, colored by SLA', 'Volumen frente a tiempo de resolución, color por SLA'],
  ['Heatmap: day of week × hour of day', 'Mapa de calor: día de la semana × hora del día'],
  ['Schematic borough map; select one to filter.', 'Esquema de municipios; selecciona uno para filtrar.'],
  ['Please try again later.', 'Inténtalo de nuevo más tarde.'],
  ['Request volume', 'Volumen de solicitudes'],
  ['Ready', 'Listo'], ['Connecting', 'Conectando'], ['Starting service', 'Iniciando servidor'],
  ['Service ready.', 'Servidor listo.'],
  ['The service is waking up. This can take a few seconds.', 'El servidor estuvo inactivo. Puede tardar unos segundos...'],
  ['Connecting to portfolio data...', 'Conectando con el servidor de portafolio...'],
  ['Connecting to operations data...', 'Conectando con el servidor de operaciones...'],
] as const
for (const [a, b] of extraPairs) { en.set(b, a); es.set(a, b) }
en.set('Dias resolucion', 'Resolution days')
en.set('Dias de resolucion prom.', 'Average resolution days')
export function translateFeature(value: string, locale: 'en' | 'es'): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  const translated = locale === 'es' ? es.get(en.get(normalized) ?? normalized) : en.get(normalized)
  if (translated) return value.replace(value.trim(), translated)
  return value
}

const textProps = new Set(['title', 'subtitle', 'label', 'description', 'tooltip', 'name', 'aria-label', 'placeholder', 'alt'])
function localize(node: ReactNode, locale: 'en' | 'es'): ReactNode {
  if (typeof node === 'string') return translateFeature(node, locale)
  if (Array.isArray(node)) return Children.map(node, child => localize(child, locale))
  if (!isValidElement(node)) return node
  const element = node as ReactElement<Record<string, unknown>>
  const props: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(element.props)) {
    if (key === 'children') props.children = localize(value as ReactNode, locale)
    else if (textProps.has(key) && typeof value === 'string') props[key] = translateFeature(value, locale)
    else if (key === 'label' && value && typeof value === 'object' && 'value' in value && typeof value.value === 'string') {
      props[key] = { ...value, value: translateFeature(value.value, locale) }
    }
    else if (['formatter', 'labelFormatter', 'tickFormatter'].includes(key) && typeof value === 'function') {
      props[key] = (...args: unknown[]) => localize(value(...args), locale)
    }
    else if (key === 'data' && Array.isArray(value)) {
      props[key] = value.map(row => {
        if (!row || typeof row !== 'object') return row
        const copy = { ...row }
        for (const field of ['method', 'metric', 'label']) {
          if (typeof copy[field] === 'string') copy[field] = translateFeature(copy[field], locale)
        }
        return copy
      })
    }
  }
  return cloneElement(element, props)
}

export function FeatureText({ children }: { children: ReactNode }) {
  const { locale } = usePreferences()
  return <>{localize(children, locale)}</>
}
