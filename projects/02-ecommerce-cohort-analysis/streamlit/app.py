"""Main entry point for the Olist E-Commerce Cohort Analysis dashboard."""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st
from utils.styles import inject_styles
from utils.data_loader import load_orders, load_customers
from utils.filters import (
    apply_date_filter, apply_date_filter_customers,
    render_global_filters, render_active_filter_badges, render_dynamic_footer,
)

st.set_page_config(
    page_title="Análisis de Cohortes -- Olist",
    page_icon=":chart_with_upwards_trend:",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Google Analytics (gtag.js)
st.markdown(
    """
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-098V02NCB0"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-098V02NCB0');</script>
    """,
    unsafe_allow_html=True,
)

inject_styles()

# -- Sidebar (navigation + branding only) --
with st.sidebar:
    st.markdown("### Análisis de Cohortes")
    st.markdown("**Olist E-Commerce**")
    st.markdown("---")

    # Data summary (read-only)
    orders = load_orders()
    customers = load_customers()
    if orders is not None:
        orders_filtered = apply_date_filter(orders)
        customers_filtered = (
            apply_date_filter_customers(customers) if customers is not None else None
        )
        st.markdown("##### Resumen de Datos")
        st.markdown(f"- **Pedidos:** {len(orders_filtered):,}")
        if customers_filtered is not None:
            st.markdown(f"- **Clientes únicos:** {len(customers_filtered):,}")
        period_start = orders_filtered["order_purchase_timestamp"].min().strftime("%b %Y")
        period_end = orders_filtered["order_purchase_timestamp"].max().strftime("%b %Y")
        st.markdown(f"- **Período:** {period_start} -- {period_end}")
        if customers_filtered is not None:
            repeat_rate = customers_filtered["is_repeat_customer"].mean() * 100
            st.markdown(f"- **Tasa de recompra:** {repeat_rate:.1f}%")

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

# -- Global filters --
render_global_filters()
render_active_filter_badges()

# -- Context box --
orders = load_orders()
customers = load_customers()
if orders is not None:
    orders_filtered = apply_date_filter(orders)
    customers_filtered = (
        apply_date_filter_customers(customers) if customers is not None else None
    )
    n_orders_str = f"{len(orders_filtered):,}"
    n_customers_str = f"{len(customers_filtered):,}" if customers_filtered is not None else "93,358"
else:
    n_orders_str = "96,478"
    n_customers_str = "93,358"

date_start = st.session_state.get("date_start")
date_end = st.session_state.get("date_end")
period_label = (
    f"{date_start.strftime('%b %Y')} y {date_end.strftime('%b %Y')}"
    if date_start and date_end
    else "septiembre 2016 y octubre 2018"
)
st.markdown(
    f"""
    <div class="contexto-box">
    <p>
    Este dashboard analiza el comportamiento de compra de <strong>{n_customers_str} clientes únicos</strong>
    ({n_orders_str} pedidos) de la plataforma Olist entre {period_label}. El análisis revela que solo el
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
    | **Proceso Técnico** | Notebooks completos: código, transformaciones y resultados intermedios |
    """
)

render_dynamic_footer(len(orders_filtered) if orders is not None else None)
