"""Main entry point for the Olist E-Commerce Cohort Analysis dashboard."""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st
from utils.styles import inject_styles
from utils.data_loader import load_orders, load_customers
from utils.filters import apply_date_filter

st.set_page_config(
    page_title="Análisis de Cohortes -- Olist",
    page_icon=":chart_with_upwards_trend:",
    layout="wide",
    initial_sidebar_state="expanded",
)

inject_styles()

# -- Sidebar --
with st.sidebar:
    st.markdown("### Análisis de Cohortes")
    st.markdown("**Olist E-Commerce**")
    st.markdown("---")

    with st.spinner("Cargando datos..."):
        orders = load_orders()
        customers = load_customers()

    if orders is not None:
        min_date = orders["order_purchase_timestamp"].dt.date.min()
        max_date = orders["order_purchase_timestamp"].dt.date.max()

        # Global date filter
        st.markdown("##### Filtros Globales")
        date_range = st.date_input(
            "Período de análisis",
            value=(min_date, max_date),
            min_value=min_date,
            max_value=max_date,
            key="_date_range_input",
        )
        if isinstance(date_range, (list, tuple)) and len(date_range) == 2:
            st.session_state["date_start"] = date_range[0]
            st.session_state["date_end"] = date_range[1]
        else:
            st.session_state["date_start"] = min_date
            st.session_state["date_end"] = max_date

        # Cohort size slider
        st.slider(
            "Tamaño mínimo de cohorte",
            min_value=10,
            max_value=500,
            value=st.session_state.get("min_cohort_size", 50),
            step=10,
            key="min_cohort_size",
        )

        # Segment multiselect
        if customers is not None:
            from utils.data_loader import load_rfm
            rfm_sidebar = load_rfm()
            if rfm_sidebar is not None:
                all_segments = sorted(rfm_sidebar["segment"].unique().tolist())
                st.multiselect(
                    "Segmentos RFM",
                    options=all_segments,
                    default=st.session_state.get("selected_segments", []),
                    key="selected_segments",
                    help="Vacío = todos los segmentos",
                )

        st.markdown("---")

        # Stats after filter
        orders_filtered = apply_date_filter(orders)
        st.markdown("##### Resumen de Datos")
        st.markdown(f"- **Pedidos:** {len(orders_filtered):,}")
        if customers is not None:
            st.markdown(f"- **Clientes únicos:** {len(customers):,}")
        period_start = orders_filtered["order_purchase_timestamp"].min().strftime("%b %Y")
        period_end = orders_filtered["order_purchase_timestamp"].max().strftime("%b %Y")
        st.markdown(f"- **Período filtrado:** {period_start} -- {period_end}")
        if customers is not None:
            repeat_rate = customers["is_repeat_customer"].mean() * 100
            st.markdown(f"- **Tasa de recompra:** {repeat_rate:.1f}%")

    st.markdown("---")
    st.markdown("##### Navegacion")
    st.markdown("Usa el menú lateral para navegar entre las páginas del dashboard.")
    st.markdown("---")
    st.markdown(
        '<div style="font-size:12px; color:#94A3B8;">'
        "Andrés González Ortega<br>"
        "UNAM -- Ciencias Actuariales"
        "</div>",
        unsafe_allow_html=True,
    )

# -- Main content --
st.markdown(
    '<div class="page-header">Análisis de Cohortes -- Olist E-Commerce</div>',
    unsafe_allow_html=True,
)
st.markdown(
    '<div class="page-subheader">'
    "Dashboard ejecutivo de retención, segmentación y valor de vida del cliente"
    "</div>",
    unsafe_allow_html=True,
)

st.markdown(
    """
    <div class="contexto-box">
    <p>
    Este dashboard analiza el comportamiento de compra de <strong>93,358 clientes únicos</strong>
    de la plataforma Olist entre septiembre 2016 y octubre 2018. El análisis revela que solo el
    ~3% de los clientes realiza una segunda compra, lo cual es la pregunta central:
    <strong>¿qué diferencia al 3% que regresa?</strong>
    </p>
    </div>
    """,
    unsafe_allow_html=True,
)

st.markdown("Selecciona una página en el menú lateral para explorar el análisis.")

st.markdown(
    """
    | Página | Contenido |
    |--------|-----------|
    | **Resumen Ejecutivo** | KPIs principales, tendencia de ingresos, funnel de retención |
    | **Retención por Cohortes** | Heatmaps de retención, curvas de supervivencia |
    | **Segmentos de Clientes** | Análisis RFM, LTV por segmento, factores de activación |
    | **Análisis Geográfico** | Comparación por estados, correlación entrega-retención |
    | **Metodología** | Definiciones, lógica de cálculo, fuente de datos |
    """
)

st.markdown(
    '<div class="dashboard-footer">'
    "Análisis de Cohortes -- Olist E-Commerce | Andrés González Ortega | "
    "Datos: Sep 2016 - Oct 2018 | N = 96,478 pedidos entregados"
    "</div>",
    unsafe_allow_html=True,
)
