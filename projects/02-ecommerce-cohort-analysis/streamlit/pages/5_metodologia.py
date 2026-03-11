"""Page 5 -- Metodologia: definitions, logic, data source documentation."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import pandas as pd

from utils.styles import inject_styles
from utils.filters import render_global_filters, render_active_filter_badges, render_dynamic_footer

inject_styles()

# -- Header --
st.markdown('<div class="page-header">Metodología</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="page-subheader">'
    "Definiciones, lógica de cálculo y fuente de datos"
    "</div>",
    unsafe_allow_html=True,
)

render_global_filters()
render_active_filter_badges()

st.markdown(
    """
    <div class="contexto-box">
    <p>
    Esta página documenta la metodología detrás de cada análisis del dashboard.
    Incluye definiciones formales, lógica de cálculo en código, y detalles sobre
    el dataset utilizado.
    </p>
    </div>
    """,
    unsafe_allow_html=True,
)

tab_coh, tab_rfm, tab_km, tab_data = st.tabs([
    "Cohortes", "RFM", "Supervivencia Kaplan-Meier", "Fuente de Datos"
])

# ---- TAB 1: Cohortes ----
with tab_coh:
    st.markdown("### Análisis de Cohortes")
    st.markdown(
        """
        Una **cohorte** es un grupo de clientes que realizaron su primera compra en el mismo mes.
        Agruparlos así permite rastrear su comportamiento colectivo a lo largo del tiempo,
        separando el efecto de la antigüedad (tiempo desde adquisición) del efecto del calendario.

        #### Definiciones clave

        | Término | Definición |
        |---------|-----------|
        | `cohort_month` | Mes de la primera compra del cliente (YYYY-MM) |
        | Mes 0 | El mes de adquisición (siempre = 100% por definición) |
        | Mes N | N meses después de la primera compra |
        | Retención mes N | % de clientes de la cohorte que compraron en el mes N |

        #### Lógica de cálculo
        """
    )

    st.code(
        """
# Asignar cohorte: mes de la primera compra
customers["cohort_month"] = (
    orders.groupby("customer_unique_id")["order_purchase_timestamp"]
    .min()
    .dt.to_period("M")
    .astype(str)
)

# Calcular months_since_cohort para cada pedido
orders = orders.merge(customers[["customer_unique_id", "cohort_month"]], on="customer_unique_id")
orders["order_period"] = orders["order_purchase_timestamp"].dt.to_period("M")
orders["months_since_cohort"] = (
    orders["order_period"].apply(lambda x: x.ordinal)
    - pd.Period(orders["cohort_month"].iloc[0], freq="M").ordinal
)

# Construir matriz de retención
cohort_data = orders.groupby(["cohort_month", "months_since_cohort"])["customer_unique_id"].nunique()
retention_matrix = cohort_data.unstack(fill_value=0)
retention_pct = retention_matrix.div(retention_matrix[0], axis=0) * 100
        """,
        language="python",
    )

    st.markdown(
        """
        #### Interpretación

        - **Columna 0**: siempre 100%. Es la base de referencia (N clientes adquiridos).
        - **Caída brusca mes 0→1**: la mayoría no regresa tras su primera compra.
        - **Estabilización mes 3-4**: los clientes que sobreviven estos meses tienen
          mayor probabilidad de ser compradores recurrentes.
        - **Celdas vacías**: la cohorte no ha alcanzado ese mes aún (censura por tiempo).
        """
    )

# ---- TAB 2: RFM ----
with tab_rfm:
    st.markdown("### Segmentación RFM")
    st.markdown(
        """
        **RFM** es un modelo de segmentación basado en tres dimensiones del comportamiento de compra:

        | Dimensión | Nombre | Descripción | Dirección |
        |-----------|--------|-------------|-----------|
        | R | **Recencia** | Días desde la última compra hasta la fecha de corte | Menor = mejor |
        | F | **Frecuencia** | Número total de pedidos entregados | Mayor = mejor |
        | M | **Monto** | Ingreso total generado por el cliente | Mayor = mejor |

        #### Scoring (quintiles)

        Cada dimensión se divide en 5 quintiles. Los clientes reciben una puntuación de 1-5:
        """
    )

    rfm_scoring = pd.DataFrame({
        "Dimensión": ["Recencia (R)", "Frecuencia (F)", "Monto (M)"],
        "Score 5 (mejor)": ["≤ percentil 20 días", "≥ percentil 80 pedidos", "≥ percentil 80 ingresos"],
        "Score 1 (peor)": ["> percentil 80 días", "= 1 pedido", "< percentil 20 ingresos"],
        "Nota": ["Invertido: menos días = mejor", "Directo", "Directo"],
    })
    st.dataframe(rfm_scoring, use_container_width=True, hide_index=True)

    st.code(
        """
# Calcular scores RFM
rfm["R_score"] = pd.qcut(rfm["recency_days"], q=5, labels=[5, 4, 3, 2, 1])
rfm["F_score"] = pd.qcut(rfm["total_orders"].rank(method="first"), q=5, labels=[1, 2, 3, 4, 5])
rfm["M_score"] = pd.qcut(rfm["total_revenue"], q=5, labels=[1, 2, 3, 4, 5])
rfm["RFM_score"] = rfm["R_score"].astype(str) + rfm["F_score"].astype(str) + rfm["M_score"].astype(str)
        """,
        language="python",
    )

    st.markdown("#### Reglas de asignación de segmentos")

    seg_rules = pd.DataFrame({
        "Segmento": [
            "Campeones", "Leales", "Potencial Leal",
            "Nuevos", "Prometedores", "Requieren Atencion",
            "En Riesgo", "Inactivos", "Perdidos",
        ],
        "Criterio R": ["5", "2-5", "3-5", "4-5", "3-4", "2-3", "<=2", "1-2", "1"],
        "Criterio F": ["4-5", "3-5", "1-3", "1", "1", "2-3", "2-5", "1-2", "1-2"],
        "Criterio M": ["4-5", "3-5", "1-3", "1", "1-2", "2-3", "1-5", "1-2", "1-2"],
    })
    st.dataframe(seg_rules, use_container_width=True, hide_index=True)

# ---- TAB 3: Kaplan-Meier ----
with tab_km:
    st.markdown("### Análisis de Supervivencia Kaplan-Meier")
    st.markdown(
        """
        El estimador **Kaplan-Meier** mide la probabilidad de que un evento (segunda compra)
        **no haya ocurrido** en función del tiempo transcurrido desde la primera compra.

        #### Conceptos clave

        | Término | Definición en este contexto |
        |---------|---------------------------|
        | `duration_days` | Días entre primera compra y segunda compra (si ocurrió) o fecha de corte del dataset |
        | `event_observed` | 1 si el cliente realizó una segunda compra, 0 si no (censurado) |
        | Censura a la derecha | Clientes que no recompraron: no sabemos si lo harán en el futuro |
        | S(t) | Probabilidad de que un cliente NO haya recomprado hasta el día t |

        #### Censura a la derecha

        La censura ocurre cuando un cliente **no ha realizado su segunda compra** al momento
        del corte del dataset (octubre 2018). No significa que nunca recompre, sino que
        **no lo hemos observado todavía**. El estimador KM maneja esto correctamente
        excluyendo a los censurados del denominador en el momento de la censura.
        """
    )

    st.code(
        """
from lifelines import KaplanMeierFitter

# Preparar datos de supervivencia
survival = customers.copy()
survival["duration_days"] = np.where(
    survival["is_repeat_customer"],
    (survival["second_purchase_date"] - survival["first_purchase_date"]).dt.days,
    (DATASET_END_DATE - survival["first_purchase_date"]).dt.days,
)
survival["event_observed"] = survival["is_repeat_customer"].astype(int)

# Ajustar modelo
kmf = KaplanMeierFitter()
kmf.fit(
    durations=survival["duration_days"],
    event_observed=survival["event_observed"],
)

# S(t): probabilidad de NO haber recomprado hasta el día t
print(kmf.survival_function_)
print(f"Mediana de supervivencia: {kmf.median_survival_time_:.0f} días")
        """,
        language="python",
    )

    st.markdown(
        """
        #### Interpretación de la curva

        - **Eje Y alto (cerca de 1.0)**: la mayoría no ha recomprado aún
        - **Caída brusca temprana**: muchas recompras ocurren en los primeros días/semanas
        - **Plateau**: después de ~180 días, la curva se estabiliza -- pocos clientes nuevos recompran
        - **Mediana**: día en el cual el 50% de los clientes que eventualmente recompran lo han hecho

        En Olist, la curva se estabiliza rápido porque el ~97% de los clientes son
        compradores únicos. La mediana solo es interpretable para el subconjunto que sí recompró.
        """
    )

# ---- TAB 4: Fuente de Datos ----
with tab_data:
    st.markdown("### Fuente de Datos: Olist E-Commerce Dataset")
    st.markdown(
        """
        El dataset es una muestra pública del marketplace brasileño **Olist**, publicada en Kaggle.
        Contiene información anonimizada de pedidos realizados entre septiembre 2016 y octubre 2018.

        #### Archivos originales (9 CSVs)
        """
    )

    files_df = pd.DataFrame({
        "Archivo CSV": [
            "olist_orders_dataset.csv",
            "olist_order_items_dataset.csv",
            "olist_customers_dataset.csv",
            "olist_products_dataset.csv",
            "olist_sellers_dataset.csv",
            "olist_order_payments_dataset.csv",
            "olist_order_reviews_dataset.csv",
            "olist_geolocation_dataset.csv",
            "product_category_name_translation.csv",
        ],
        "Contenido": [
            "Pedidos: status, fechas, customer_id",
            "Items por pedido: precio, flete, seller_id",
            "Clientes: customer_id, customer_unique_id, estado",
            "Productos: categoría, dimensiones, peso",
            "Vendedores: estado, ciudad",
            "Pagos: método, valor, cuotas",
            "Reseñas: score (1-5), comentarios",
            "Coordenadas geográficas por ZIP",
            "Traducción de categorías al inglés",
        ],
        "Filas aprox.": [
            "99,441", "112,650", "99,441", "32,951",
            "3,095", "103,886", "100,000", "1,000,163", "71"
        ],
    })
    st.dataframe(files_df, use_container_width=True, hide_index=True)

    st.markdown(
        """
        #### Caveat crítico: `customer_id` vs `customer_unique_id`

        Olist tiene **dos identificadores de cliente**:

        - `customer_id`: identificador por pedido. Un mismo cliente puede tener múltiples `customer_id`.
        - `customer_unique_id`: identificador único real del cliente (el que usamos en este análisis).

        Usar `customer_id` sobrestimaría el número de clientes únicos e inflaría artificialmente
        la tasa de retención.
        """
    )

    st.code(
        """
# CORRECTO: usar customer_unique_id para identificar clientes
customers_unique = orders.merge(
    raw_customers[["customer_id", "customer_unique_id"]],
    on="customer_id"
)

# INCORRECTO: usar customer_id directamente
# orders.groupby("customer_id")...  # sobreestima clientes únicos
        """,
        language="python",
    )

    st.markdown(
        """
        #### Alcance del análisis

        | Métrica | Valor |
        |---------|-------|
        | Período | Sep 2016 -- Oct 2018 (25 meses) |
        | Pedidos entregados | ~96,478 |
        | Clientes únicos | ~93,358 |
        | Tasa de recompra | ~3.1% |
        | Estados cubiertos | 27 (todos los estados de Brasil) |
        | Categorías de productos | 73 |

        #### Limitaciones

        - **Censura**: El dataset termina en Oct 2018. Clientes adquiridos en meses tardíos
          tienen menos tiempo para recomprar, lo que puede subestimar su tasa de retención real.
        - **Marketplace**: Olist es intermediario. La experiencia del cliente depende
          también del vendedor individual, no solo de la plataforma.
        - **Datos faltantes**: ~8% de pedidos con `review_score` faltante;
          algunos estados con muy pocos clientes pueden tener métricas inestables.
        """
    )

# -- Footer --
render_dynamic_footer(None)
