"""Page 1 -- Resumen Ejecutivo: KPIs, revenue trend, customer funnel."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import pandas as pd
import numpy as np

from utils.styles import inject_styles
from utils.data_loader import load_orders, load_customers
from utils.filters import apply_date_filter, apply_date_filter_customers, render_active_filter_badges, render_dynamic_footer
from utils import charts
from components.metric_row import render_metric_row
from components.chart_container import render_chart_container
from components.insight_box import render_insight_box

inject_styles()

# -- Load data --
orders_raw = load_orders()
customers = load_customers()

if orders_raw is None or customers is None:
    st.error("No se pudieron cargar los datos. Verifica que existan los archivos parquet.")
    st.stop()

# Apply global date filter
orders = apply_date_filter(orders_raw)
customers = apply_date_filter_customers(customers)

# -- Header --
st.markdown('<div class="page-header">Resumen Ejecutivo</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="page-subheader">'
    "Vista panorámica del negocio: ingresos, clientes y retención"
    "</div>",
    unsafe_allow_html=True,
)

render_active_filter_badges()

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
with st.spinner("Calculando KPIs..."):
    total_customers = len(customers)
    total_revenue = customers["total_revenue"].sum()
    repeat_rate = customers["is_repeat_customer"].mean() * 100
    avg_ltv = customers["total_revenue"].mean()

    # YoY delta for revenue annotation (2017 vs 2018)
    rev_2017 = orders[orders["order_purchase_timestamp"].dt.year == 2017]["total_order_value"].sum()
    rev_2018 = orders[orders["order_purchase_timestamp"].dt.year == 2018]["total_order_value"].sum()
    if rev_2017 > 0 and rev_2018 > 0:
        yoy_pct = (rev_2018 - rev_2017) / rev_2017 * 100
    else:
        yoy_pct = None

render_metric_row([
    {"label": "Clientes Únicos", "value": charts.format_number(total_customers),
     "border_color": "#2563EB"},
    {"label": "Ingresos Totales", "value": charts.format_number(total_revenue),
     "prefix": "R$ ", "border_color": "#059669"},
    {"label": "Tasa de Recompra", "value": f"{repeat_rate:.1f}",
     "suffix": "%", "border_color": "#D97706"},
    {"label": "LTV Promedio", "value": charts.format_number(avg_ltv),
     "prefix": "R$ ", "border_color": "#7C3AED"},
])

st.markdown("<br>", unsafe_allow_html=True)

# -- Tabs for charts --
tab_ing, tab_adq, tab_ret = st.tabs(["Ingresos", "Adquisicion", "Retencion"])

with tab_ing:
    with st.spinner("Cargando tendencia de ingresos..."):
        monthly_rev = (
            orders.groupby("order_month")["total_order_value"]
            .sum()
            .reset_index()
            .rename(columns={"order_month": "Mes", "total_order_value": "Ingresos"})
            .sort_values("Mes")
        )

    fig_rev = charts.area_chart(monthly_rev, "Mes", "Ingresos", height=380)
    fig_rev.update_layout(
        yaxis_title="Ingresos (R$)", xaxis_title="", xaxis_tickangle=-45,
    )

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
            f"<ul>"
            f"<li>Pico de ingresos en <strong>{peak_month}</strong> con R$ {peak_val:,.0f}</li>"
            f"<li>Crecimiento acelerado desde mediados de 2017</li>"
            f"<li>Meseta en el segundo semestre de 2018</li>"
            f"</ul>"
        ),
        source_text="Fuente: Olist E-Commerce Dataset | Pedidos entregados",
    )

    st.download_button(
        "Descargar datos de ingresos",
        monthly_rev.to_csv(index=False).encode("utf-8"),
        "revenue_mensual.csv",
        "text/csv",
    )

with tab_adq:
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
        "Tamaño de cada cohorte de adquisición (azul = sobre promedio)",
        fig_cohort,
        interpretation=(
            f"<ul>"
            f"<li>Promedio mensual de adquisición: <strong>{avg_cohort:,.0f}</strong> clientes nuevos</li>"
            f"<li>Las cohortes más grandes coinciden con el período de mayor inversión en marketing (Q1-Q2 2018)</li>"
            f"</ul>"
        ),
        source_text="Fuente: Olist E-Commerce Dataset | Primer pedido del cliente",
    )

    st.download_button(
        "Descargar datos de adquisición",
        cohort_sizes.to_csv(index=False).encode("utf-8"),
        "adquisicion_cohortes.csv",
        "text/csv",
    )

with tab_ret:
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
            f"<ul style='margin:4px 0; padding-left:18px; line-height:1.8;'>"
            f"<li>1a → 2a compra: <strong>{conv_1_2:.1f}%</strong> convierte</li>"
            f"<li>2a → 3a compra: <strong>{conv_2_3:.1f}%</strong> de quienes ya recompraron</li>"
            f"<li>3a → 4a+ compra: <strong>{conv_3_4:.1f}%</strong></li>"
            f"</ul>"
            f"<p style='margin:6px 0 0;'>La mayor barrera está en la <strong>primera recompra</strong>.</p>"
        ),
        source_text="Fuente: Olist E-Commerce Dataset",
    )

    funnel_df = pd.DataFrame({"Etapa": funnel_labels, "Clientes": funnel_values})
    st.download_button(
        "Descargar datos del funnel",
        funnel_df.to_csv(index=False).encode("utf-8"),
        "funnel_retencion.csv",
        "text/csv",
    )

# -- Insight box --
render_insight_box(
    finding=(
        f"<ul>"
        f"<li>Tasa de recompra: apenas <strong>{repeat_rate:.1f}%</strong></li>"
        f"<li>De {total_customers:,} clientes únicos, solo <strong>{second:,}</strong> realizaron una segunda compra</li>"
        f"<li>Esta métrica es la <strong>palanca de crecimiento más crítica</strong></li>"
        f"</ul>"
    ),
    recommendation=(
        f"<ol>"
        f"<li>Implementar programa de reenganche post-compra con incentivos dirigidos "
        f"(cupón de descuento dentro de los primeros 30 días)</li>"
        f"<li>Un aumento del 1pp en recompra = ~930 clientes adicionales "
        f"y potencialmente R$ {930 * avg_ltv:,.0f} en ingresos incrementales</li>"
        f"</ol>"
    ),
    box_type="warning",
)

# -- Footer --
render_dynamic_footer(len(orders))
