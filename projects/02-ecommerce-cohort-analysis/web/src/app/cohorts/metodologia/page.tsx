import type { Metadata } from 'next'
import staticMeta from '@/data/meta.json'

export const metadata: Metadata = {
  title: 'Metodología — Análisis de Cohortes Olist',
  description:
    'Definiciones, lógica de cálculo, fuente de datos y limitaciones del análisis de cohortes sobre el marketplace Olist.',
}

/**
 * Documentation, so this page is a server component: it has no state, no charts
 * and no data fetch, and shipping it as a client bundle would cost JavaScript to
 * render text that never changes.
 */

const es = new Intl.NumberFormat('es-MX')

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="space-y-3 scroll-mt-6">
      <h2 className="font-serif text-2xl text-[var(--chart-label)] border-b border-border dark:border-[#2a2a2a] pb-2">
        {title}
      </h2>
      <div className="font-sans text-sm text-muted leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="border border-border dark:border-[#2a2a2a] bg-[var(--chart-bg)] rounded-sm p-4 overflow-x-auto">
      <code className="font-mono text-xs leading-relaxed text-[var(--chart-label)]">{children}</code>
    </pre>
  )
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-sans border-collapse">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="text-left py-2 pr-4 border-b border-border dark:border-[#2a2a2a] font-medium text-muted whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 dark:border-[#2a2a2a]/50">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 align-top text-[var(--chart-label)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MetodologiaPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="font-sans text-xs tracking-widest uppercase text-muted">Metodología</p>
        <h1 className="font-serif text-3xl md:text-4xl leading-tight">Cómo está calculado</h1>
        <p className="font-sans text-base text-muted max-w-2xl leading-relaxed">
          Definiciones, la lógica de cada cálculo, la fuente de los datos y lo que este análisis no
          puede decir. Todo lo que aparece en los tableros sale de aquí.
        </p>
      </header>

      <nav aria-label="Índice" className="font-sans text-sm">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
          {[
            ['cohortes', 'Cohortes'],
            ['rfm', 'Segmentación RFM'],
            ['supervivencia', 'Kaplan-Meier'],
            ['activacion', 'Activación'],
            ['datos', 'Fuente de datos'],
            ['arquitectura', 'De Streamlit a estático'],
            ['limitaciones', 'Limitaciones'],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="hover:text-[var(--chart-label)] transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="cohortes" title="Análisis de cohortes">
        <p>
          Una <strong className="text-[var(--chart-label)]">cohorte</strong> agrupa a los clientes
          por el mes de su primera compra. Seguirlas por separado permite distinguir dos cosas que
          una métrica agregada mezcla: el efecto de la antigüedad del cliente y el efecto del
          calendario. Si la retención cae igual en todas las cohortes, el problema es estructural; si
          cae sólo en algunas, hay algo que cambió en ese momento.
        </p>
        <Table
          head={['Término', 'Definición']}
          rows={[
            [<code key="a">cohort_month</code>, 'Mes de la primera compra del cliente (YYYY-MM)'],
            ['Mes 0', 'El mes de adquisición. 100% por definición'],
            ['Mes N', 'N meses naturales después de la primera compra'],
            [
              'Retención mes N',
              'Clientes de la cohorte que compraron en el mes N, sobre el tamaño de la cohorte',
            ],
          ]}
        />
        <Code>{`# Cohorte = mes de la primera compra
customers["cohort_month"] = (
    orders.groupby("customer_unique_id")["order_purchase_timestamp"]
    .min().dt.to_period("M").astype(str)
)

# Matriz de retención: cohorte x meses transcurridos
cohort_data = (
    orders.groupby(["cohort_month", "months_since_cohort"])["customer_unique_id"]
    .nunique()
)
retention_matrix = cohort_data.unstack(fill_value=0)
retention_pct = retention_matrix.div(retention_matrix[0], axis=0) * 100`}</Code>
        <p>
          <strong className="text-[var(--chart-label)]">Celdas vacías, no ceros.</strong> Una cohorte
          de {staticMeta.date_end.slice(0, 7)} no puede tener un mes 12 en un dataset que termina en{' '}
          {staticMeta.date_end.slice(0, 7)}. Aquí esas celdas se dejan en blanco y quedan fuera de
          los promedios. Es la única diferencia deliberada frente al tablero de Streamlit que este
          reemplaza: aquel usaba <code>unstack(fill_value=0)</code> y contaba esos meses como 0% de
          retención, lo que arrastraba la cola de la curva promedio hacia abajo por censura y no por
          comportamiento. Por eso la curva promedio publica también el número de cohortes que entran
          en cada punto.
        </p>
      </Section>

      <Section id="rfm" title="Segmentación RFM">
        <p>
          RFM puntúa a cada cliente en tres dimensiones y combina los puntajes en segmentos
          accionables. Se calcula sobre el estado final de cada cliente, no por su mes de
          adquisición — razón por la cual el filtro de cohortes no mueve esta página.
        </p>
        <Table
          head={['Dimensión', 'Qué mide', 'Dirección']}
          rows={[
            ['R — Recencia', 'Días desde la última compra al corte del dataset', 'Menor es mejor'],
            ['F — Frecuencia', 'Número total de pedidos entregados', 'Mayor es mejor'],
            ['M — Monto', 'Ingreso total generado por el cliente', 'Mayor es mejor'],
          ]}
        />
        <Code>{`rfm["R_score"] = pd.qcut(rfm["recency_days"], q=5, labels=[5, 4, 3, 2, 1])
rfm["F_score"] = pd.qcut(rfm["total_orders"].rank(method="first"), q=5, labels=[1, 2, 3, 4, 5])
rfm["M_score"] = pd.qcut(rfm["total_revenue"], q=5, labels=[1, 2, 3, 4, 5])`}</Code>
        <p>
          La frecuencia se rankea antes de cortar en quintiles porque su distribución es casi
          degenerada: con un 97% de clientes en un solo pedido,{' '}
          <code>qcut</code> sobre los valores crudos no encuentra cinco cortes distintos y falla.
          Rankear rompe los empates de forma arbitraria pero estable, que es lo mejor disponible
          cuando la variable casi no varía — y conviene saberlo al leer los segmentos: la F aporta
          poca información real en este dataset.
        </p>
      </Section>

      <Section id="supervivencia" title="Supervivencia Kaplan-Meier">
        <p>
          El estimador Kaplan-Meier responde: ¿cuál es la probabilidad de que un cliente{' '}
          <em>todavía no</em> haya hecho su segunda compra, t días después de la primera? Es la
          herramienta correcta aquí porque el dato está{' '}
          <strong className="text-[var(--chart-label)]">censurado por la derecha</strong>: de un
          cliente que aún no recompró no sabemos que nunca lo hará, sólo que no lo ha hecho todavía.
          Tratar esos casos como &laquo;no recompra&raquo; subestimaría la retención de las cohortes
          recientes.
        </p>
        <Table
          head={['Término', 'En este contexto']}
          rows={[
            [
              <code key="d">duration_days</code>,
              'Días de la primera a la segunda compra, o al corte del dataset si no hubo segunda',
            ],
            [<code key="e">event_observed</code>, '1 si hubo segunda compra, 0 si el caso está censurado'],
            ['S(t)', 'Probabilidad de no haber recomprado hasta el día t'],
          ]}
        />
        <p>
          La curva se estima en el pipeline, no en el navegador, y se muestrea en una malla semanal
          hasta los 720 días. Los intervalos usan la transformación log-log (Greenwood exponencial),
          que es la que produce <code>lifelines</code> por omisión; la forma directa sobre S(t) puede
          salirse de [0, 1], que para una probabilidad no es dibujable. El producto se acumula sobre
          cada tiempo de evento distinto y sólo después se muestrea, porque hacerlo al revés
          calcularía mal el conjunto en riesgo.
        </p>
        <p>
          <strong className="text-[var(--chart-label)]">La mediana no existe.</strong> S(t) se
          estabiliza cerca del 95% y nunca llega al 50%, así que no hay un día en el que la mitad de
          los clientes haya recomprado. El tablero informa &laquo;sin mediana&raquo; en lugar de un
          número: con ~97% de compradores únicos, el evento que la mediana mediría casi nunca ocurre.
        </p>
      </Section>

      <Section id="activacion" title="Factores de activación">
        <p>
          Una regresión logística sobre la probabilidad de una segunda compra, usando sólo variables
          conocidas en el primer pedido: su valor, su reseña, el número de artículos, el medio de
          pago y la categoría. Los coeficientes se presentan como odds ratios en escala log₂, donde
          duplicar y reducir a la mitad quedan a la misma distancia del cero.
        </p>
        <p>
          El gráfico colorea una variable sólo cuando su intervalo al 95% no cruza el cero. Un
          coeficiente cuyo intervalo incluye &laquo;sin efecto&raquo; no tiene dirección que
          afirmar, aunque su estimación puntual caiga a un lado. Y todo esto es observacional: las
          asociaciones describen a quién conviene buscar, no qué pasaría si se cambiara la variable.
        </p>
      </Section>

      <Section id="datos" title="Fuente de datos">
        <p>
          Muestra pública del marketplace brasileño Olist, publicada en Kaggle: nueve CSV con
          pedidos anonimizados. Este análisis usa {es.format(staticMeta.orders)} pedidos entregados
          de {es.format(staticMeta.customers)} clientes únicos, entre{' '}
          {staticMeta.date_start} y {staticMeta.date_end}, en {staticMeta.states} estados.
        </p>
        <Table
          head={['Métrica', 'Valor']}
          rows={[
            ['Pedidos entregados', es.format(staticMeta.orders)],
            ['Clientes únicos', es.format(staticMeta.customers)],
            ['Tasa de recompra', `${staticMeta.repeat_rate}%`],
            ['Ingresos totales', `R$ ${es.format(Math.round(staticMeta.total_revenue))}`],
            ['LTV promedio', `R$ ${es.format(Math.round(staticMeta.avg_ltv))}`],
            ['Estados', String(staticMeta.states)],
          ]}
        />
        <p>
          <strong className="text-[var(--chart-label)]">
            <code>customer_unique_id</code>, nunca <code>customer_id</code>.
          </strong>{' '}
          Olist emite un <code>customer_id</code> nuevo por pedido, así que agrupar por él contaría
          cada compra como un cliente distinto: inflaría el número de clientes y haría desaparecer
          la recompra por construcción — el hallazgo central del análisis sería un artefacto de la
          llave elegida.
        </p>
        <Code>{`# Correcto: la identidad real del cliente
customers = orders.merge(
    raw_customers[["customer_id", "customer_unique_id"]], on="customer_id"
)
customers.groupby("customer_unique_id")   # una fila por persona

# Incorrecto: una "persona" por pedido
# orders.groupby("customer_id")`}</Code>
      </Section>

      <Section id="arquitectura" title="De Streamlit a estático">
        <p>
          Este tablero fue una aplicación Streamlit que leía 36 MB de parquet en cada interacción y
          por eso necesitaba un contenedor corriendo. Sus tres filtros —rango de cohortes, tamaño
          mínimo de cohorte y segmento RFM— resultaron ser{' '}
          <strong className="text-[var(--chart-label)]">subconjuntos</strong>, nunca recálculos:
          seleccionan filas de una matriz ya agregada. Nada volvía a calcularse desde los{' '}
          {es.format(staticMeta.orders)} pedidos.
        </p>
        <p>
          Así que la misma interactividad sobrevive a un export estático, siempre que el JSON esté
          preagregado en los ejes por los que cortan los filtros: mes de cohorte, segmento y estado.
          Los dos conjuntos por cliente ({es.format(staticMeta.customers)} filas cada uno) no se
          publican: el mapa RFM sale como rejilla agrupada y la curva de supervivencia como puntos
          ya estimados. El resultado son {es.format(276)} KB de JSON —unos 38 KB comprimidos— en
          lugar de un servicio con estado.
        </p>
        <p>
          Que los números no cambiaran es una afirmación verificable, así que está verificada:{' '}
          <code>data-pipeline/06_verify_parity.py</code> vuelve a calcular cada cifra desde el
          parquet con las mismas expresiones que usaban las páginas de Streamlit y las compara con el
          JSON publicado. La curva Kaplan-Meier y sus dos intervalos se comparan contra{' '}
          <code>lifelines</code>, la implementación de referencia, en toda la malla.
        </p>
      </Section>

      <Section id="limitaciones" title="Limitaciones">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-[var(--chart-label)]">Censura.</strong> El dataset termina en{' '}
            {staticMeta.date_end}. Las cohortes más recientes han tenido menos tiempo para recomprar,
            así que su retención observada es un piso, no una estimación.
          </li>
          <li>
            <strong className="text-[var(--chart-label)]">Es un marketplace.</strong> Olist es
            intermediario: la experiencia depende también del vendedor, que este análisis no puede
            separar de la plataforma.
          </li>
          <li>
            <strong className="text-[var(--chart-label)]">Observacional.</strong> Ninguna cifra aquí
            identifica un efecto causal. La correlación entre entrega y recompra se calcula sobre 24
            estados como unidades, y São Paulo difiere del norte del país en mucho más que la
            logística.
          </li>
          <li>
            <strong className="text-[var(--chart-label)]">Datos faltantes.</strong> Cerca del 8% de
            los pedidos no tiene reseña. Los promedios de reseña y de entrega se calculan sobre los
            pedidos que sí la tienen, con numerador y denominador propios en lugar de rellenar.
          </li>
          <li>
            <strong className="text-[var(--chart-label)]">Frecuencia casi constante.</strong> Con un
            97% de clientes de un solo pedido, la F de RFM aporta poca información y los segmentos
            los separa sobre todo la recencia y el monto.
          </li>
        </ul>
      </Section>
    </>
  )
}
