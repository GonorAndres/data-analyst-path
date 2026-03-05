"""Page 3 -- Segmentos de Clientes: RFM, LTV curves, activation analysis, Lorenz/Gini."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px

from utils.styles import inject_styles
from utils.data_loader import load_rfm, load_ltv_curves, load_activation
from utils import charts
from components.metric_row import render_metric_row
from components.chart_container import render_chart_container
from components.insight_box import render_insight_box

inject_styles()

# -- Load data --
rfm = load_rfm()
ltv = load_ltv_curves()
activation = load_activation()

if rfm is None:
    st.error("No se pudo cargar rfm_segments.parquet.")
    st.stop()

# -- Header --
st.markdown('<div class="page-header">Segmentos de Clientes</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="page-subheader">'
    "Segmentación RFM, valor de vida y factores de activación"
    "</div>",
    unsafe_allow_html=True,
)

# -- Contexto --
st.markdown(
    """
    <div class="contexto-box">
    <p>
    El análisis <strong>RFM</strong> (Recencia, Frecuencia, Monto) segmenta a los clientes
    según su comportamiento de compra. Combinado con el análisis de LTV y los factores de
    activación, permite identificar dónde concentrar los esfuerzos de retención y que
    acciones tienen mayor probabilidad de éxito.
    </p>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("Cómo leer este análisis"):
    st.markdown(
        """
        - **R (Recencia)**: Días desde la última compra (menor = mejor)
        - **F (Frecuencia)**: Número total de compras
        - **M (Monto)**: Ingresos totales del cliente
        - Cada dimensión se puntúa de 1 a 5 (5 = mejor comportamiento)
        - Los segmentos agrupan combinaciones de R, F, M en perfiles accionables
        """
    )

# -- Segment distribution mini-KPIs --
segment_counts = rfm["segment"].value_counts()
top_segments = segment_counts.head(4)

seg_metrics = []
seg_colors = ["#2563EB", "#059669", "#D97706", "#DC2626"]
for i, (seg, count) in enumerate(top_segments.items()):
    pct = count / len(rfm) * 100
    seg_metrics.append({
        "label": seg,
        "value": f"{count:,}",
        "suffix": f" ({pct:.1f}%)",
        "border_color": seg_colors[i % len(seg_colors)],
    })

render_metric_row(seg_metrics)
st.markdown("<br>", unsafe_allow_html=True)

# -- Chart 1: Segment sizes horizontal bar --
seg_df = segment_counts.reset_index()
seg_df.columns = ["Segmento", "Clientes"]

seg_df = seg_df.sort_values("Clientes", ascending=True)

fig_seg_bar = charts.bar_chart(
    seg_df, "Segmento", "Clientes", horizontal=True, color=charts.ACCENT, height=400,
)
fig_seg_bar.update_layout(yaxis_title="", xaxis_title="Número de Clientes")

render_chart_container(
    "Distribución de Segmentos RFM",
    "Tamaño de cada segmento de clientes",
    fig_seg_bar,
    interpretation=(
        f"El segmento más grande es '{segment_counts.index[0]}' con "
        f"{segment_counts.iloc[0]:,} clientes ({segment_counts.iloc[0]/len(rfm)*100:.1f}%). "
        "La concentración en pocos segmentos indica una base de clientes con comportamiento "
        "predominantemente transaccional de una sola compra."
    ),
    source_text="Fuente: Olist E-Commerce Dataset | Segmentación RFM",
)

# -- Chart 2: RFM Scatter (recency vs frequency, size=monetary, color=segment) --
# Sample for performance
rfm_sample = rfm.sample(min(5000, len(rfm)), random_state=42)

fig_scatter = px.scatter(
    rfm_sample,
    x="recency_days",
    y="total_orders",
    size="total_revenue",
    color="segment",
    color_discrete_sequence=charts.CATEGORICAL,
    size_max=20,
    opacity=0.7,
)
fig_scatter.update_layout(
    **charts._base_layout(), height=480,
    xaxis_title="Recencia (días desde última compra)",
    yaxis_title="Frecuencia (número de compras)",
    legend_title_text="Segmento",
)

render_chart_container(
    "Mapa de Segmentos RFM",
    "Recencia vs Frecuencia (tamaño = monto monetario, color = segmento)",
    fig_scatter,
    interpretation=(
        "Los clientes se concentran en baja frecuencia (1-2 compras). "
        "Los segmentos de alto valor (Champions, Loyal) aparecen como puntos grandes "
        "con baja recencia y mayor frecuencia, esquina inferior derecha."
    ),
    source_text=f"Fuente: Olist E-Commerce Dataset | Muestra de {len(rfm_sample):,} clientes",
)

# -- Chart 3: Segment profile table --
seg_profile = (
    rfm.groupby("segment")
    .agg(
        clientes=("segment", "size"),
        recencia_prom=("recency_days", "mean"),
        frecuencia_prom=("total_orders", "mean"),
        ingreso_prom=("total_revenue", "mean"),
        ingreso_total=("total_revenue", "sum"),
    )
    .reset_index()
    .sort_values("ingreso_total", ascending=False)
)
seg_profile["pct_ingresos"] = (seg_profile["ingreso_total"] / seg_profile["ingreso_total"].sum() * 100)

st.markdown(
    '<div class="chart-container">'
    '<div class="chart-title">Perfil de Segmentos</div>'
    '<div class="chart-subtitle">Métricas promedio por segmento RFM</div>'
    '</div>',
    unsafe_allow_html=True,
)

st.dataframe(
    seg_profile.rename(columns={
        "segment": "Segmento",
        "clientes": "Clientes",
        "recencia_prom": "Recencia Prom (días)",
        "frecuencia_prom": "Frecuencia Prom",
        "ingreso_prom": "Ingreso Prom (R$)",
        "ingreso_total": "Ingreso Total (R$)",
        "pct_ingresos": "% Ingresos",
    }).style.format({
        "Recencia Prom (días)": "{:.0f}",
        "Frecuencia Prom": "{:.2f}",
        "Ingreso Prom (R$)": "{:,.0f}",
        "Ingreso Total (R$)": "{:,.0f}",
        "% Ingresos": "{:.1f}%",
    }).background_gradient(subset=["% Ingresos"], cmap="Blues"),
    use_container_width=True,
    hide_index=True,
)

# -- Chart 4: LTV curves by segment --
if ltv is not None and len(ltv) > 0:
    fig_ltv = px.line(
        ltv, x="months_since_cohort", y="cumulative_revenue_per_customer",
        color="segment", color_discrete_sequence=charts.CATEGORICAL,
    )
    fig_ltv.update_layout(
        **charts._base_layout(), height=420,
        xaxis_title="Meses desde primera compra",
        yaxis_title="Ingreso Acumulado por Cliente (R$)",
        legend_title_text="Segmento",
    )

    idx_max = ltv.groupby("segment")["cumulative_revenue_per_customer"].idxmax()
    idx_max = idx_max[idx_max.notna()]
    if len(idx_max) > 0:
        max_ltv_seg = ltv.loc[idx_max]
        top_ltv = max_ltv_seg.sort_values("cumulative_revenue_per_customer", ascending=False).iloc[0]
        ltv_interp = (
            f"El segmento '{top_ltv['segment']}' alcanza el mayor LTV con "
            f"R$ {top_ltv['cumulative_revenue_per_customer']:,.0f} por cliente. "
            "Las curvas muestran que la mayor parte del valor se genera en los primeros "
            "3 meses, reforzando la importancia de una activación temprana."
        )
    else:
        ltv_interp = "Las curvas muestran el ingreso acumulado por segmento en el tiempo."

    render_chart_container(
        "Curvas de Valor de Vida (LTV) por Segmento",
        "Ingreso acumulado promedio por cliente en función del tiempo",
        fig_ltv,
        interpretation=ltv_interp,
        source_text="Fuente: Olist E-Commerce Dataset | LTV acumulado por segmento",
    )

# -- Chart 5: Activation odds ratios --
if activation is not None and len(activation) > 0:
    act = activation.copy()
    act["significant"] = act["p_value"] < 0.05
    act = act.sort_values("odds_ratio", ascending=True)

    # Filter for interpretable range
    act_filtered = act[
        (act["odds_ratio"] > 0.01) & (act["odds_ratio"] < 100)
    ].copy()

    colors_act = [
        charts.SUCCESS if (row["odds_ratio"] > 1 and row["significant"]) else
        charts.DANGER if (row["odds_ratio"] < 1 and row["significant"]) else
        charts.TEXT_MUTED
        for _, row in act_filtered.iterrows()
    ]

    # Log scale for odds ratios
    act_filtered["log_or"] = np.log2(act_filtered["odds_ratio"])
    act_filtered["log_ci_lower"] = np.log2(act_filtered["ci_lower"].clip(lower=0.001))
    act_filtered["log_ci_upper"] = np.log2(act_filtered["ci_upper"].clip(lower=0.001))

    fig_act = go.Figure()
    fig_act.add_trace(go.Bar(
        y=act_filtered["feature"],
        x=act_filtered["log_or"],
        orientation="h",
        marker_color=colors_act,
        error_x=dict(
            type="data",
            symmetric=False,
            array=(act_filtered["log_ci_upper"] - act_filtered["log_or"]).tolist(),
            arrayminus=(act_filtered["log_or"] - act_filtered["log_ci_lower"]).tolist(),
            color=charts.TEXT_MUTED,
            thickness=1.5,
        ),
    ))
    fig_act.add_vline(x=0, line_dash="dash", line_color=charts.TEXT_MUTED, line_width=1)
    fig_act.update_layout(
        **charts._base_layout(), height=max(350, len(act_filtered) * 30),
        xaxis_title="Log2(Odds Ratio) -- derecha = mayor probabilidad de recompra",
        yaxis_title="",
        showlegend=False,
    )

    sig_positive = act_filtered[(act_filtered["odds_ratio"] > 1) & act_filtered["significant"]]
    sig_negative = act_filtered[(act_filtered["odds_ratio"] < 1) & act_filtered["significant"]]

    interp_parts = []
    if len(sig_positive) > 0:
        top_pos = sig_positive.sort_values("odds_ratio", ascending=False).iloc[0]
        interp_parts.append(
            f"El factor más asociado con la recompra es '{top_pos['feature']}' "
            f"(OR = {top_pos['odds_ratio']:.2f})."
        )
    if len(sig_negative) > 0:
        top_neg = sig_negative.sort_values("odds_ratio").iloc[0]
        interp_parts.append(
            f"El factor más asociado con NO recomprar es '{top_neg['feature']}' "
            f"(OR = {top_neg['odds_ratio']:.2f})."
        )

    render_chart_container(
        "Factores de Activación (Odds Ratios)",
        "Qué factores predicen una segunda compra (verde = positivo, rojo = negativo, gris = no significativo)",
        fig_act,
        interpretation=" ".join(interp_parts) if interp_parts else (
            "Los odds ratios muestran la asociacion de cada variable con la probabilidad de recompra."
        ),
        source_text="Fuente: Regresión logística sobre datos de primera compra | p < 0.05 = significativo",
    )

# -- Chart 6: Lorenz Curve + Gini --
revenue_sorted = np.sort(rfm["total_revenue"].values)
n = len(revenue_sorted)
cum_revenue = np.cumsum(revenue_sorted) / revenue_sorted.sum()
cum_population = np.arange(1, n + 1) / n

# Gini coefficient
_trapz = getattr(np, "trapezoid", None) or np.trapz
gini = 1 - 2 * _trapz(cum_revenue, cum_population)

fig_lorenz = go.Figure()

# Equality line
fig_lorenz.add_trace(go.Scatter(
    x=[0, 1], y=[0, 1],
    mode="lines", line=dict(color=charts.TEXT_MUTED, dash="dash", width=1.5),
    name="Igualdad perfecta",
))

# Lorenz curve
fig_lorenz.add_trace(go.Scatter(
    x=cum_population, y=cum_revenue,
    mode="lines", line=dict(color=charts.ACCENT, width=2.5),
    fill="tozeroy", fillcolor="rgba(37,99,235,0.08)",
    name=f"Lorenz (Gini = {gini:.3f})",
))

fig_lorenz.update_layout(
    **charts._base_layout(), height=420,
    xaxis_title="Proporción acumulada de clientes",
    yaxis_title="Proporción acumulada de ingresos",
)
fig_lorenz.update_xaxes(range=[0, 1], gridcolor=charts.GRID)
fig_lorenz.update_yaxes(range=[0, 1], gridcolor=charts.GRID)

# Key percentiles
top_20_rev = cum_revenue[int(0.8 * n)]
top_10_rev = cum_revenue[int(0.9 * n)]

fig_lorenz.add_annotation(
    x=0.8, y=top_20_rev,
    text=f"Top 20% = {(1-top_20_rev)*100:.0f}% ingresos",
    showarrow=True, arrowhead=2,
    font=dict(size=11, color=charts.NAVY),
    arrowcolor=charts.NAVY,
)

render_chart_container(
    "Curva de Lorenz -- Concentración de Ingresos",
    f"Coeficiente de Gini = {gini:.3f}",
    fig_lorenz,
    interpretation=(
        f"El coeficiente de Gini es {gini:.3f}, indicando una alta concentración de ingresos. "
        f"El 20% superior de clientes genera el {(1-top_20_rev)*100:.0f}% de los ingresos totales. "
        "Esta desigualdad refuerza la importancia de identificar y retener a los clientes de alto valor."
    ),
    source_text="Fuente: Olist E-Commerce Dataset | Distribución de ingresos por cliente",
)

# -- Insight box --
champion_seg = rfm[rfm["segment"].str.contains("Champion", case=False, na=False)]
if len(champion_seg) > 0:
    champ_pct = len(champion_seg) / len(rfm) * 100
    champ_rev_pct = champion_seg["total_revenue"].sum() / rfm["total_revenue"].sum() * 100
    finding = (
        f"Los 'Champions' representan solo el {champ_pct:.1f}% de la base pero "
        f"generan el {champ_rev_pct:.1f}% de los ingresos. "
        f"El coeficiente de Gini de {gini:.3f} confirma una alta concentración."
    )
else:
    finding = (
        f"El coeficiente de Gini de {gini:.3f} indica una fuerte concentración "
        "de ingresos en pocos clientes."
    )

render_insight_box(
    finding=finding,
    recommendation=(
        "Crear un programa de fidelización diferenciado para el top 20% de clientes. "
        "Atención prioritaria, acceso anticipado a ofertas y comunicación personalizada. "
        "Paralelamente, analizar los factores de activación para mover clientes "
        "de segmentos de bajo valor hacia segmentos más rentables."
    ),
    box_type="success",
)

# -- Footer --
st.markdown(
    '<div class="dashboard-footer">'
    "Análisis de Cohortes -- Olist E-Commerce | Andrés González Ortega | "
    "Datos: Sep 2016 - Oct 2018 | N = 96,478 pedidos entregados"
    "</div>",
    unsafe_allow_html=True,
)
