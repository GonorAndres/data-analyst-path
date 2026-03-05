"""Page 4 -- Análisis Geográfico: state comparisons, delivery-retention correlation."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go

from utils.styles import inject_styles
from utils.data_loader import load_orders, load_customers
from utils import charts
from components.chart_container import render_chart_container
from components.insight_box import render_insight_box

inject_styles()

# -- Load data --
orders = load_orders()
customers = load_customers()

if orders is None or customers is None:
    st.error("No se pudieron cargar los datos.")
    st.stop()

# -- Header --
st.markdown('<div class="page-header">Análisis Geográfico</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="page-subheader">'
    "Patrones de retención, entrega y satisfacción por estado brasileño"
    "</div>",
    unsafe_allow_html=True,
)

# -- Contexto --
st.markdown(
    """
    <div class="contexto-box">
    <p>
    Brasil es un país de dimensiones continentales con enormes diferencias logísticas entre
    estados. Este análisis explora como la ubicación geográfica del cliente impacta la
    retención, los tiempos de entrega y la satisfacción, para identificar oportunidades
    de mejora regional.
    </p>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("Cómo leer este análisis"):
    st.markdown(
        """
        - Cada estado se identifica por su abreviatura oficial (SP, RJ, MG, etc.)
        - **Tasa de retención**: porcentaje de clientes con más de una compra
        - **Días de entrega**: promedio de días calendario entre compra y entrega
        - **Review score**: calificación promedio (1-5 estrellas)
        - Usa el filtro de estados para comparar regiones específicas
        """
    )

# -- State-level metrics --
state_metrics = (
    customers.groupby("customer_state")
    .agg(
        clientes=("customer_state", "size"),
        ingresos=("total_revenue", "sum"),
        aov=("avg_order_value", "mean"),
        retencion=("is_repeat_customer", "mean"),
        recencia_prom=("recency_days", "mean"),
    )
    .reset_index()
)

state_orders = (
    orders.groupby("customer_state")
    .agg(
        pedidos=("order_id", "nunique"),
        review_prom=("review_score", "mean"),
        entrega_prom=("delivery_days", "mean"),
    )
    .reset_index()
)

state_df = state_metrics.merge(state_orders, on="customer_state", how="left")
state_df["retencion_pct"] = state_df["retencion"] * 100
state_df = state_df.sort_values("clientes", ascending=False)

# -- State filter --
top_5 = state_df.head(5)["customer_state"].tolist()
all_states = state_df["customer_state"].tolist()

selected_states = st.multiselect(
    "Seleccionar estados para comparar",
    options=all_states,
    default=top_5,
)

if not selected_states:
    st.warning("Selecciona al menos un estado.")
    st.stop()

filtered = state_df[state_df["customer_state"].isin(selected_states)].copy()

# -- Chart 1: State ranking by retention rate --
ret_sorted = filtered.sort_values("retencion_pct", ascending=True)

# Color tiers
ret_median = state_df["retencion_pct"].median()
tier_colors = [
    charts.SUCCESS if v > ret_median * 1.2 else
    charts.WARNING if v > ret_median * 0.8 else
    charts.DANGER
    for v in ret_sorted["retencion_pct"]
]

fig_ret = charts.colored_bar_chart(
    ret_sorted, "customer_state", "retencion_pct", tier_colors,
    horizontal=True, height=max(300, len(filtered) * 35),
)
fig_ret.update_layout(
    xaxis_title="Tasa de Retención (%)",
    yaxis_title="",
)
fig_ret.add_vline(
    x=ret_median, line_dash="dash", line_color=charts.TEXT_MUTED,
    annotation_text=f"Mediana nacional: {ret_median:.1f}%",
    annotation_position="top right",
    annotation_font_color=charts.TEXT_MUTED,
)

best_state = ret_sorted.iloc[-1]
worst_state = ret_sorted.iloc[0]

render_chart_container(
    "Ranking de Retención por Estado",
    "Tasa de recompra por estado (verde = sobre mediana, rojo = bajo mediana)",
    fig_ret,
    interpretation=(
        f"'{best_state['customer_state']}' lidera con {best_state['retencion_pct']:.1f}% de retención, "
        f"mientras que '{worst_state['customer_state']}' tiene la más baja con {worst_state['retencion_pct']:.1f}%. "
        f"La mediana nacional es {ret_median:.1f}%."
    ),
    source_text="Fuente: Olist E-Commerce Dataset | Clientes con >= 1 pedido entregado",
)

# -- Chart 2: State KPI comparison table --
table_df = filtered[
    ["customer_state", "pedidos", "ingresos", "aov", "retencion_pct",
     "review_prom", "entrega_prom"]
].copy()
table_df = table_df.sort_values("ingresos", ascending=False)

st.markdown(
    '<div class="chart-container">'
    '<div class="chart-title">Comparación de KPIs por Estado</div>'
    '<div class="chart-subtitle">Métricas clave de los estados seleccionados</div>'
    '</div>',
    unsafe_allow_html=True,
)

st.dataframe(
    table_df.rename(columns={
        "customer_state": "Estado",
        "pedidos": "Pedidos",
        "ingresos": "Ingresos (R$)",
        "aov": "AOV (R$)",
        "retencion_pct": "Retención (%)",
        "review_prom": "Review Prom",
        "entrega_prom": "Entrega (días)",
    }).style.format({
        "Pedidos": "{:,}",
        "Ingresos (R$)": "{:,.0f}",
        "AOV (R$)": "{:,.0f}",
        "Retención (%)": "{:.1f}",
        "Review Prom": "{:.2f}",
        "Entrega (días)": "{:.1f}",
    }).background_gradient(subset=["Retención (%)"], cmap="Greens")
    .background_gradient(subset=["Entrega (días)"], cmap="Reds"),
    use_container_width=True,
    hide_index=True,
)

# -- Chart 3: Retention curves by selected states --
# Compute monthly retention per state
orders_with_state = orders[orders["customer_state"].isin(selected_states)].copy()

state_cohort = (
    orders_with_state.groupby(["customer_state", "months_since_cohort"])["customer_unique_id"]
    .nunique()
    .reset_index(name="clientes")
)

# Normalize by month 0
month0 = state_cohort[state_cohort["months_since_cohort"] == 0][["customer_state", "clientes"]].copy()
month0.rename(columns={"clientes": "base"}, inplace=True)
state_cohort = state_cohort.merge(month0, on="customer_state")
state_cohort["retencion"] = state_cohort["clientes"] / state_cohort["base"] * 100

# Filter to first 12 months
state_cohort = state_cohort[state_cohort["months_since_cohort"] <= 12]

fig_state_ret = go.Figure()
for i, state in enumerate(selected_states):
    sdata = state_cohort[state_cohort["customer_state"] == state]
    fig_state_ret.add_trace(go.Scatter(
        x=sdata["months_since_cohort"], y=sdata["retencion"],
        mode="lines+markers",
        line=dict(color=charts.CATEGORICAL[i % len(charts.CATEGORICAL)], width=2.5),
        marker=dict(size=5),
        name=state,
    ))

fig_state_ret.update_layout(
    **charts._base_layout(), height=400,
    xaxis_title="Meses desde primera compra",
    yaxis_title="Retención (%)",
    legend_title_text="Estado",
)

render_chart_container(
    "Curvas de Retención por Estado",
    f"Comparación de retención para {len(selected_states)} estados seleccionados",
    fig_state_ret,
    interpretation=(
        "Las curvas muestran como varía la retención entre estados. "
        "Estados con mejor infraestructura logística tienden a mostrar "
        "curvas de retención ligeramente superiores."
    ),
    source_text="Fuente: Olist E-Commerce Dataset | Retención mensual por estado",
)

# -- Chart 4: Delivery days vs retention scatter by state --
scatter_df = state_df[state_df["clientes"] >= 100].copy()

fig_delivery = go.Figure()
fig_delivery.add_trace(go.Scatter(
    x=scatter_df["entrega_prom"],
    y=scatter_df["retencion_pct"],
    mode="markers+text",
    text=scatter_df["customer_state"],
    textposition="top center",
    textfont=dict(size=11, color=charts.NAVY),
    marker=dict(
        size=np.sqrt(scatter_df["clientes"]) / 3,
        color=charts.ACCENT,
        opacity=0.7,
        line=dict(width=1, color=charts.NAVY),
    ),
    hovertemplate=(
        "<b>%{text}</b><br>"
        "Entrega: %{x:.1f} días<br>"
        "Retención: %{y:.1f}%<br>"
        "<extra></extra>"
    ),
))

# Trend line
fit_df = scatter_df[["entrega_prom", "retencion_pct"]].dropna()
if len(fit_df) >= 3:
    z = np.polyfit(fit_df["entrega_prom"], fit_df["retencion_pct"], 1)
    p = np.poly1d(z)
    x_line = np.linspace(fit_df["entrega_prom"].min(), fit_df["entrega_prom"].max(), 50)
    fig_delivery.add_trace(go.Scatter(
        x=x_line, y=p(x_line),
        mode="lines", line=dict(color=charts.DANGER, dash="dash", width=1.5),
        name="Tendencia",
        showlegend=True,
    ))
    correlation = fit_df["entrega_prom"].corr(fit_df["retencion_pct"])
else:
    correlation = 0

fig_delivery.update_layout(
    **charts._base_layout(), height=450,
    xaxis_title="Días Promedio de Entrega",
    yaxis_title="Tasa de Retención (%)",
    showlegend=True,
)

render_chart_container(
    "Tiempo de Entrega vs Retención por Estado",
    f"Correlación: r = {correlation:.3f} (tamaño = número de clientes)",
    fig_delivery,
    interpretation=(
        f"La correlación entre días de entrega y retención es r = {correlation:.3f}. "
        + (
            "La relación negativa sugiere que estados con entregas más rápidas "
            "tienden a tener mejor retención. "
            if correlation < -0.1 else
            "La relación es débil, sugiriendo que otros factores además de la logística "
            "influyen en la retención. "
        )
        + "Los estados del sureste (SP, RJ, MG) suelen combinar entregas rápidas con "
        "mejores tasas de retención."
    ),
    source_text=f"Fuente: Olist E-Commerce Dataset | Estados con >= 100 clientes (N = {len(scatter_df)})",
)

# -- Insight box --
best_delivery = f"{best_state['entrega_prom']:.1f}" if pd.notna(best_state['entrega_prom']) else "N/D"
worst_delivery = f"{worst_state['entrega_prom']:.1f}" if pd.notna(worst_state['entrega_prom']) else "N/D"
render_insight_box(
    finding=(
        f"Existe una correlación de {correlation:.3f} entre tiempo de entrega y retención. "
        f"El estado con mejor retención ('{best_state['customer_state']}') tiene un promedio de "
        f"{best_delivery} días de entrega, vs "
        f"{worst_delivery} días en '{worst_state['customer_state']}'."
    ),
    recommendation=(
        "Priorizar la expansión de centros de distribución en estados con altos tiempos "
        "de entrega pero buena demanda. Paralelamente, establecer expectativas de entrega "
        "más transparentes para estados lejanos y compensar con programas de fidelización "
        "diferenciados por region."
    ),
    box_type="insight",
)

# -- Footer --
st.markdown(
    '<div class="dashboard-footer">'
    "Análisis de Cohortes -- Olist E-Commerce | Andrés González Ortega | "
    "Datos: Sep 2016 - Oct 2018 | N = 96,478 pedidos entregados"
    "</div>",
    unsafe_allow_html=True,
)
