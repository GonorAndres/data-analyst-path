"""Main entry point for the Olist E-Commerce Cohort Analysis dashboard."""

import sys
import os

# Add streamlit dir to path for component imports
sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st
from utils.styles import inject_styles
from utils.data_loader import load_orders, load_customers

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

    orders = load_orders()
    customers = load_customers()

    if orders is not None and customers is not None:
        st.markdown("##### Resumen de Datos")
        st.markdown(f"- **Pedidos:** {len(orders):,}")
        st.markdown(f"- **Clientes únicos:** {len(customers):,}")
        st.markdown(
            f"- **Período:** {orders['order_purchase_timestamp'].min().strftime('%b %Y')} "
            f"-- {orders['order_purchase_timestamp'].max().strftime('%b %Y')}"
        )
        repeat_rate = customers["is_repeat_customer"].mean() * 100
        st.markdown(f"- **Tasa de recompra:** {repeat_rate:.1f}%")

    st.markdown("---")
    st.markdown("##### Navegacion")
    st.markdown(
        "Usa el menú lateral para navegar entre las páginas del dashboard."
    )
    st.markdown("---")
    st.markdown(
        '<div style="font-size:12px; color:#94A3B8;">'
        "Andrés González Ortega<br>"
        "UNAM -- Ciencias Actuariales"
        "</div>",
        unsafe_allow_html=True,
    )

# -- Main content --
st.markdown('<div class="page-header">Análisis de Cohortes -- Olist E-Commerce</div>', unsafe_allow_html=True)
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
    """
)

st.markdown(
    '<div class="dashboard-footer">'
    "Análisis de Cohortes -- Olist E-Commerce | Andrés González Ortega | "
    "Datos: Sep 2016 - Oct 2018 | N = 96,478 pedidos entregados"
    "</div>",
    unsafe_allow_html=True,
)
