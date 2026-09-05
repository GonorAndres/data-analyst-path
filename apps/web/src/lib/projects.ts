export type Project = {
  id: string
  title: { en: string; es: string }
  category: { en: string; es: string }
  description: { en: string; es: string }
  paths: string[]
  tools: string[]
}

/** Visitor-facing case studies. E-commerce contains two complementary analyses. */
export const projects: Project[] = [
  { id: 'insurance', title: { en: 'Insurance claims', es: 'Siniestros y reservas' },
    category: { en: 'Insurance', es: 'Seguros' },
    description: { en: 'Understand claim development, compare reserving methods, and investigate portfolio profitability.', es: 'Entender el desarrollo de siniestros, comparar métodos de reservas y analizar la rentabilidad de una cartera.' },
    paths: ['/insurance/'], tools: ['SQL', 'Python', 'Actuarial analysis'] },
  { id: 'ecommerce', title: { en: 'The customer behind the order', es: 'El cliente detrás del pedido' },
    category: { en: 'E-commerce', es: 'Comercio electrónico' },
    description: { en: 'Explore marketplace performance and why customers return through two complementary Olist analyses.', es: 'Explorar el desempeño del marketplace y la recompra mediante dos análisis complementarios de Olist.' },
    paths: ['/olist/', '/cohorts/'], tools: ['SQL', 'Python', 'Cohorts & RFM'] },
  { id: 'abtest', title: { en: 'From experiment to decision', es: 'Del experimento a la decisión' },
    category: { en: 'Product analytics', es: 'Analítica de producto' },
    description: { en: 'Evaluate an e-commerce experiment using statistical evidence, uncertainty, and business impact.', es: 'Evaluar un experimento de comercio electrónico con evidencia estadística, incertidumbre e impacto de negocio.' },
    paths: ['/abtest/'], tools: ['Python', 'A/B testing', 'Bayesian analysis'] },
  { id: 'kpi', title: { en: 'An executive view of growth', es: 'Una visión ejecutiva del crecimiento' },
    category: { en: 'Business reporting', es: 'Reportes de negocio' },
    description: { en: 'Connect revenue, customer behavior, forecasts, and automated reporting in one executive view.', es: 'Conectar ingresos, comportamiento del cliente, pronósticos y reportes automatizados en una vista ejecutiva.' },
    paths: ['/kpi/'], tools: ['Python', 'Forecasting', 'PDF reporting'] },
  { id: 'portfolio', title: { en: 'Risk behind the return', es: 'El riesgo detrás del rendimiento' },
    category: { en: 'Financial analytics', es: 'Analítica financiera' },
    description: { en: 'Explore a multi-asset portfolio through performance, risk, correlation, and scenario analysis.', es: 'Explorar un portafolio multiactivo mediante rendimiento, riesgo, correlación y análisis de escenarios.' },
    paths: ['/portfolio/'], tools: ['Python', 'Monte Carlo', 'Optimization'] },
  { id: 'operations', title: { en: 'Where operations slow down', es: 'Dónde se frenan las operaciones' },
    category: { en: 'Operational analytics', es: 'Analítica operativa' },
    description: { en: 'Find bottlenecks and service-level patterns in New York City’s 311 service requests.', es: 'Identificar cuellos de botella y patrones de servicio en las solicitudes 311 de Nueva York.' },
    paths: ['/operations/'], tools: ['Python', 'D3', 'Process mining'] },
  { id: 'airbnb', title: { en: 'A city through its listings', es: 'Una ciudad a través de sus alojamientos' },
    category: { en: 'Market research', es: 'Análisis de mercado' },
    description: { en: 'Investigate pricing, geography, and host concentration in Mexico City’s short-term rental market.', es: 'Analizar precios, distribución geográfica y concentración de anfitriones en los alojamientos de Ciudad de México.' },
    paths: ['/airbnb/'], tools: ['Python', 'Exploratory analysis', 'Recharts'] },
]

export function projectForPath(pathname: string) {
  const path = pathname.endsWith('/') ? pathname : pathname + '/'
  return projects.find(project => project.paths.some(prefix => path.startsWith(prefix)))
}

export function analysisName(path: string, locale: 'en' | 'es') {
  if (path.startsWith('/cohorts')) return locale === 'en' ? 'Customer retention' : 'Retención de clientes'
  if (path.startsWith('/olist')) return locale === 'en' ? 'Marketplace performance' : 'Desempeño del marketplace'
  return projectForPath(path)?.category[locale] ?? ''
}

export const routeTitles: Record<string, { en: string; es: string }> = {
  '/': { en: 'Data Analyst', es: 'Analista de Datos' },
  '/insurance': { en: 'Reserves and Claims', es: 'Reservas y siniestralidad' },
  '/olist': { en: 'Olist E-Commerce', es: 'Olist — Comercio electrónico' },
  '/cohorts': { en: 'Customer Retention — Olist E-Commerce', es: 'Retención de clientes — Olist' },
  '/cohorts/retencion': { en: 'Cohort retention — Olist', es: 'Retención por cohortes — Olist' },
  '/cohorts/segmentos': { en: 'Customer segments — Olist', es: 'Segmentos de clientes — Olist' },
  '/cohorts/geografia': { en: 'Geographic analysis — Olist', es: 'Análisis geográfico — Olist' },
  '/cohorts/metodologia': { en: 'Methodology — Olist', es: 'Metodología — Olist' },
  '/cohorts/notebooks': { en: 'Technical process — Olist', es: 'Proceso técnico — Olist' },
  '/abtest': { en: 'A/B Test Lab', es: 'Laboratorio de pruebas A/B' },
  '/abtest/notebooks': { en: 'Technical Process — A/B Test Lab', es: 'Proceso técnico — Pruebas A/B' },
  '/kpi': { en: 'Executive KPI Report', es: 'Reporte ejecutivo de KPIs' },
  '/portfolio': { en: 'Portfolio analytics', es: 'Analítica de portafolio' },
  '/operations': { en: 'NYC 311 Operations', es: 'Operaciones NYC 311' },
  '/airbnb': { en: 'Airbnb CDMX', es: 'Airbnb CDMX' },
}
