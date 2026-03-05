"""Page 1 -- Resumen Ejecutivo: KPIs, revenue trend, customer funnel."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import pandas as pd
import numpy as np

from utils.styles import inject_styles
from utils.data_loader import load_orders, load_customers
from utils import charts
from components.metric_row import render_metric_row
from components.chart_container import render_chart_container
from components.insight_box import render_insight_box

inject_styles()

# -- Load data --
orders = load_orders()
customers = load_customers()

if orders is None or customers is None:
    st.error("No se pudieron cargar los datos. Verifica que existan los archivos parquet.")
    st.stop()

# -- Header --
st.markdown('<div class="page-header">Resumen Ejecutivo</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="page-subheader">'
    "Vista panorámica del negocio: ingresos, clientes y retención"
    "</div>",
    unsafe_allow_html=True,
)

# -- Contexto --
st.markdown(
    """
    <div class="contexto-box">
    <p>
    Este resumen presenta los indicadores clave del marketplace Olist. Con casi 100,000 pedidos
    entregados en 25 meses, el reto principal es una tasa de recompra de solo ~3%. Los KPIs
    siguientes enmarcan la escala del problema y las oportunidades de mejora.
    </p>
    </div>
    """,
    unsafe_allow_html=True,
)

# -- KPIs --
total_customers = len(customers)
total_revenue = customers["total_revenue"].sum()
repeat_rate = customers["is_repeat_customer"].mean() * 100
avg_ltv = customers["total_revenue"].mean()

render_metric_row([
    {"label": "Clientes Únicos", "value": f"{total_customers:,}",
     "border_color": "#2563EB"},
    {"label": "Ingresos Totales", "value": f"{total_revenue:,.0f}",
     "prefix": "R$ ", "border_color": "#059669"},
    {"label": "Tasa de Recompra", "value": f"{repeat_rate:.1f}",
     "suffix": "%", "border_color": "#D97706"},
    {"label": "LTV Promedio", "value": f"{avg_ltv:,.0f}",
     "prefix": "R$ ", "border_color": "#7C3AED"},
])

st.markdown("<br>", unsafe_allow_html=True)

# -- Chart 1: Monthly revenue area chart --
monthly_rev = (
    orders.groupby("order_month")["total_order_value"]
    .sum()
    .reset_index()
    .rename(columns={"order_month": "Mes", "total_order_value": "Ingresos"})
    .sort_values("Mes")
)

fig_rev = charts.area_chart(monthly_rev, "Mes", "Ingresos", height=380)
fig_rev.update_layout(
    yaxis_title="Ingresos (R$)",
    xaxis_title="",
    xaxis_tickangle=-45,
)

# Annotate peak
peak_idx = monthly_rev["Ingresos"].idxmax()
peak_month = monthly_rev.loc[peak_idx, "Mes"]
peak_val = monthly_rev.loc[peak_idx, "Ingresos"]
fig_rev.add_annotation(
    x=peak_month, y=peak_val,
    text=f"Pico: R$ {peak_val:,.0f}",
    showarrow=True, arrowhead=2,
    font=dict(size=12, color=charts.NAVY),
    arrowcolor=charts.NAVY,
)

render_chart_container(
    "Tendencia Mensual de Ingresos",
    "Ingresos totales por mes de compra",
    fig_rev,
    interpretation=(
        f"Los ingresos alcanzaron su pico en {peak_month} con R$ {peak_val:,.0f}. "
        "Se observa un crecimiento acelerado desde mediados de 2017, "
        "seguido de una meseta en el segundo semestre de 2018."
    ),
    source_text="Fuente: Olist E-Commerce Dataset | Pedidos entregados",
)

# -- Chart 2: New customers per cohort month --
cohort_sizes = (
    customers.groupby("cohort_month")
    .size()
    .reset_index(name="Clientes")
    .sort_values("cohort_month")
)
cohort_sizes.rename(columns={"cohort_month": "Cohorte"}, inplace=True)

avg_cohort = cohort_sizes["Clientes"].mean()
colors_cohort = [
    charts.ACCENT if v >= avg_cohort else charts.TEXT_MUTED
    for v in cohort_sizes["Clientes"]
]

fig_cohort = charts.colored_bar_chart(
    cohort_sizes, "Cohorte", "Clientes", colors_cohort, height=380,
)
fig_cohort.add_hline(
    y=avg_cohort, line_dash="dash", line_color=charts.WARNING,
    annotation_text=f"Promedio: {avg_cohort:,.0f}",
    annotation_position="top right",
    annotation_font_color=charts.WARNING,
)
fig_cohort.update_layout(xaxis_tickangle=-45, yaxis_title="Clientes Nuevos", xaxis_title="")

render_chart_container(
    "Clientes Nuevos por Cohorte Mensual",
    "Tamaño de cada cohorte de adquisición (barras azules = por encima del promedio)",
    fig_cohort,
    interpretation=(
        f"El promedio mensual de adquisición es de {avg_cohort:,.0f} clientes nuevos. "
        "Las cohortes más grandes coinciden con el período de mayor inversión en marketing "
        "(Q1-Q2 2018)."
    ),
    source_text="Fuente: Olist E-Commerce Dataset | Primer pedido del cliente",
)

# -- Chart 3: Retention funnel --
purchase_counts = customers["total_orders"].value_counts().sort_index()
first = len(customers)
second = int(purchase_counts[purchase_counts.index >= 2].sum())
third = int(purchase_counts[purchase_counts.index >= 3].sum())
fourth_plus = int(purchase_counts[purchase_counts.index >= 4].sum())

funnel_labels = [
    f"1a compra ({first:,})",
    f"2a compra ({second:,})",
    f"3a compra ({third:,})",
    f"4a+ compra ({fourth_plus:,})",
]
funnel_values = [first, second, third, fourth_plus]

fig_funnel = charts.funnel_chart(funnel_labels, funnel_values, height=350)

conv_1_2 = second / first * 100
conv_2_3 = third / second * 100 if second > 0 else 0
conv_3_4 = fourth_plus / third * 100 if third > 0 else 0

render_chart_container(
    "Funnel de Retención por Número de Compra",
    "Cuántos clientes alcanzan cada etapa de recompra",
    fig_funnel,
    interpretation=(
        f"Solo {conv_1_2:.1f}% de los clientes realiza una segunda compra. "
        f"De quienes compran dos veces, {conv_2_3:.1f}% llega a la tercera. "
        f"La conversión de 3a a 4a+ es de {conv_3_4:.1f}%. "
        "La mayor barrera está en la primera recompra."
    ),
    source_text="Fuente: Olist E-Commerce Dataset",
)

# -- Insight box --
render_insight_box(
    finding=(
        f"La tasa de recompra de Olist es de apenas {repeat_rate:.1f}%, "
        f"lo que significa que de {total_customers:,} clientes únicos, "
        f"solo {second:,} realizaron una segunda compra. "
        "Esta métrica es la palanca de crecimiento más crítica."
    ),
    recommendation=(
        "Implementar un programa de reenganche post-compra con incentivos dirigidos "
        "(cupón de descuento dentro de los primeros 30 días). "
        "Incluso un aumento del 1pp en recompra representaria ~930 clientes adicionales "
        f"y potencialmente R$ {930 * avg_ltv:,.0f} en ingresos incrementales."
    ),
    box_type="warning",
)

# -- Footer --
st.markdown(
    '<div class="dashboard-footer">'
    "Análisis de Cohortes -- Olist E-Commerce | Andrés González Ortega | "
    "Datos: Sep 2016 - Oct 2018 | N = 96,478 pedidos entregados"
    "</div>",
    unsafe_allow_html=True,
)
