"""Page 6 -- Proceso Técnico: rendered Jupyter notebooks showing the analytical pipeline."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import streamlit.components.v1 as components

from utils.styles import inject_styles
from utils.filters import render_active_filter_badges, render_dynamic_footer

inject_styles()

# -- Header --
st.markdown('<div class="page-header">Proceso Técnico</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="page-subheader">'
    "Pipeline analítico completo: desde la ingesta de datos hasta la segmentación final"
    "</div>",
    unsafe_allow_html=True,
)

render_active_filter_badges()

st.markdown(
    """
    <div class="contexto-box">
    <p>
    Cada pestaña muestra un notebook de Jupyter ejecutado con el código, transformaciones
    y resultados intermedios que alimentan las visualizaciones del dashboard. El flujo sigue
    un orden secuencial: limpieza, exploración, retención y segmentación.
    </p>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("Sobre esta sección"):
    st.markdown(
        """
        - Los notebooks se renderizan tal cual fueron ejecutados durante el análisis
        - El código Python y SQL es visible junto con sus resultados
        - Las gráficas interactivas (Plotly) mantienen su funcionalidad dentro del visor
        - Scroll vertical dentro de cada pestaña para recorrer el notebook completo
        """
    )

# -- Notebook metadata --
_NB_DIR = os.path.join(os.path.dirname(__file__), "..", "notebooks_html")

NOTEBOOKS = [
    {
        "file": "01_data_ingestion_cleaning.html",
        "tab": "01 Ingesta",
        "desc": (
            "Carga de los 9 CSVs originales de Olist, joins entre tablas, limpieza de tipos, "
            "generación de <code>orders_enriched.parquet</code> y <code>customers_summary.parquet</code>."
        ),
        "outputs": "<strong>9 CSVs</strong> &rarr; 2 parquets analíticos (orders, customers)",
    },
    {
        "file": "02_eda_exploratory.html",
        "tab": "02 EDA",
        "desc": (
            "Distribuciones de ingresos, tendencias temporales, patrones geográficos "
            "y análisis de métodos de pago. Identifica los hallazgos macro del dataset."
        ),
        "outputs": "13 visualizaciones interactivas, hallazgos clave documentados",
    },
    {
        "file": "03_cohort_retention.html",
        "tab": "03 Retención",
        "desc": (
            "Construcción de la matriz de retención, curvas de supervivencia Kaplan-Meier, "
            "pruebas de log-rank y análisis de churn por cohorte."
        ),
        "outputs": "Matriz de retención, datos de supervivencia, revenue retention",
    },
    {
        "file": "04_rfm_ltv_activation.html",
        "tab": "04 RFM y LTV",
        "desc": (
            "Segmentación RFM, curvas de valor de vida (LTV) por segmento, "
            "regresión logística de factores de activación y curva de Lorenz/Gini."
        ),
        "outputs": "Segmentos RFM, curvas LTV, coeficientes de activación",
    },
]

# -- Tabs --
tabs = st.tabs([nb["tab"] for nb in NOTEBOOKS])

for tab, nb in zip(tabs, NOTEBOOKS):
    with tab:
        path = os.path.join(_NB_DIR, nb["file"])

        # Description card
        st.markdown(
            f'<div style="padding:10px 14px; background:#F1F5F9; border-left:3px solid #2563EB; '
            f'border-radius:4px; margin-bottom:8px; font-size:14px; line-height:1.6;">'
            f'{nb["desc"]}<br>'
            f'<span style="color:#64748B; font-size:12px;">Produce: {nb["outputs"]}</span>'
            f'</div>',
            unsafe_allow_html=True,
        )

        if not os.path.exists(path):
            st.warning(f"Notebook HTML no encontrado: {nb['file']}")
            continue

        with open(path, "r", encoding="utf-8") as f:
            html_content = f.read()

        components.html(html_content, height=800, scrolling=True)

# -- Footer --
render_dynamic_footer(None)
