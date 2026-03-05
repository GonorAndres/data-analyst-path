"""Page 2 -- Retención por Cohortes: heatmaps, retention curves, survival analysis."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go

from utils.styles import inject_styles
from utils.data_loader import (
    load_cohort_retention, load_cohort_revenue, load_survival, load_customers,
)
from utils import charts
from components.chart_container import render_chart_container
from components.insight_box import render_insight_box

inject_styles()

# -- Load data --
retention = load_cohort_retention()
revenue_ret = load_cohort_revenue()
survival = load_survival()
customers = load_customers()

if retention is None:
    st.error("No se pudo cargar cohort_retention_matrix.parquet.")
    st.stop()

# -- Header --
st.markdown('<div class="page-header">Retención por Cohortes</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="page-subheader">'
    "Cómo evoluciona la retención de clientes mes a mes por cohorte de adquisición"
    "</div>",
    unsafe_allow_html=True,
)

# -- Contexto --
st.markdown(
    """
    <div class="contexto-box">
    <p>
    Una <strong>cohorte</strong> agrupa a los clientes por el mes de su primera compra.
    Rastrear su comportamiento posterior revela patrones de retención y señales de churn.
    Los heatmaps muestran el porcentaje de clientes (o ingresos) que regresan en cada mes
    subsecuente.
    </p>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("Cómo leer este análisis"):
    st.markdown(
        """
        - **Filas**: Cohortes mensuales (mes de primera compra)
        - **Columnas**: Meses transcurridos desde la primera compra (0 = mes de adquisición)
        - **Valores del heatmap**: Porcentaje de clientes que compraron en ese mes relativo
        - **Colores más oscuros** = mayor retención
        - La columna 0 siempre es 100% (todos compraron en su mes de adquisición)
        """
    )

# -- Toggle: Clientes vs Ingresos --
mode = st.radio(
    "Métrica de retención",
    ["Por Clientes", "Por Ingresos"],
    horizontal=True,
)

if mode == "Por Clientes":
    data = retention.copy()
    label_suffix = "clientes"
    fmt = ".1f"
else:
    data = revenue_ret.copy() if revenue_ret is not None else retention.copy()
    label_suffix = "ingresos"
    fmt = ".1f"

# Convert to percentages (relative to month 0)
data_pct = data.div(data.iloc[:, 0], axis=0) * 100

# Filter cohorts with reasonable size (>50 customers in month 0)
valid_cohorts = retention.index[retention.iloc[:, 0] >= 50]
data_pct_filtered = data_pct.loc[data_pct.index.isin(valid_cohorts)]

if len(data_pct_filtered) == 0:
    st.warning("No hay cohortes con >= 50 clientes en el mes 0.")
    st.stop()

# -- Chart 1: Retention Heatmap --
z_vals = data_pct_filtered.values
x_labels = [str(c) for c in data_pct_filtered.columns]
y_labels = [str(idx) for idx in data_pct_filtered.index]
text_vals = np.full(z_vals.shape, "", dtype=object)
mask = z_vals > 0
text_vals[mask] = [f"{v:.1f}%" for v in z_vals[mask]]

fig_heatmap = charts.heatmap(
    z=z_vals, x_labels=x_labels, y_labels=y_labels,
    text=text_vals, height=550,
)
fig_heatmap.update_layout(
    xaxis_title="Meses desde primera compra",
    yaxis_title="Cohorte (mes de adquisición)",
)

# Compute average retention for interpretation
avg_m1 = data_pct_filtered.iloc[:, 1].mean() if data_pct_filtered.shape[1] > 1 else 0
avg_m3 = data_pct_filtered.iloc[:, 3].mean() if data_pct_filtered.shape[1] > 3 else 0

render_chart_container(
    f"Heatmap de Retención por {label_suffix.title()}",
    f"Porcentaje de {label_suffix} retenidos en cada mes relativo a la cohorte",
    fig_heatmap,
    interpretation=(
        f"La retención promedio al mes 1 es de {avg_m1:.1f}% y al mes 3 de {avg_m3:.1f}%. "
        "La caída más pronunciada ocurre entre el mes 0 y el mes 1, "
        "indicando que la mayoría de los clientes no regresa después de su primera compra."
    ),
    source_text=f"Fuente: Olist E-Commerce Dataset | Cohortes con >=50 {label_suffix} en mes 0",
)

# -- Chart 2: Average retention curve with CI --
avg_curve = data_pct_filtered.iloc[:, :13].mean(axis=0)
std_curve = data_pct_filtered.iloc[:, :13].std(axis=0)
n_cohorts = len(data_pct_filtered)
se = std_curve / np.sqrt(n_cohorts)
ci_upper = avg_curve + 1.96 * se
ci_lower = (avg_curve - 1.96 * se).clip(lower=0)

fig_curve = go.Figure()

# Ghost lines (individual cohorts)
for idx_name in data_pct_filtered.index:
    row = data_pct_filtered.loc[idx_name].iloc[:13]
    fig_curve.add_trace(go.Scatter(
        x=list(range(len(row))), y=row.values,
        mode="lines", line=dict(color="rgba(37,99,235,0.08)", width=1),
        showlegend=False, hoverinfo="skip",
    ))

# CI band
fig_curve.add_trace(go.Scatter(
    x=list(range(len(ci_upper))) + list(range(len(ci_lower)))[::-1],
    y=ci_upper.tolist() + ci_lower.tolist()[::-1],
    fill="toself", fillcolor="rgba(37,99,235,0.12)",
    line=dict(color="rgba(0,0,0,0)"),
    showlegend=False, hoverinfo="skip",
))

# Average line
fig_curve.add_trace(go.Scatter(
    x=list(range(len(avg_curve))), y=avg_curve.values,
    mode="lines+markers",
    line=dict(color=charts.ACCENT, width=3),
    marker=dict(size=6, color=charts.ACCENT),
    name="Promedio",
))

fig_curve.update_layout(
    **charts._base_layout(), height=400,
    xaxis_title="Meses desde primera compra",
    yaxis_title=f"Retención de {label_suffix} (%)",
    yaxis_range=[0, max(ci_upper.max() * 1.1, 10)],
)

render_chart_container(
    f"Curva Promedio de Retención ({label_suffix.title()})",
    "Promedio de todas las cohortes con intervalo de confianza al 95%",
    fig_curve,
    interpretation=(
        "Las líneas tenues representan cohortes individuales. "
        "La banda azul muestra el intervalo de confianza del 95%. "
        "La retención se estabiliza después del mes 3-4, sugiriendo que "
        "los clientes que sobreviven los primeros meses tienen mayor probabilidad de ser leales."
    ),
    source_text=f"Fuente: Olist E-Commerce Dataset | N = {n_cohorts} cohortes",
)

# -- Chart 3: Best vs worst cohort --
# Use sum of retention across months 1-6 as proxy for cohort quality
retention_quality = data_pct_filtered.iloc[:, 1:7].sum(axis=1)
if len(retention_quality) >= 2:
    best_cohort = retention_quality.idxmax()
    worst_cohort = retention_quality.idxmin()

    fig_compare = go.Figure()
    best_data = data_pct_filtered.loc[best_cohort].iloc[:13]
    worst_data = data_pct_filtered.loc[worst_cohort].iloc[:13]

    fig_compare.add_trace(go.Scatter(
        x=list(range(len(best_data))), y=best_data.values,
        mode="lines+markers",
        line=dict(color=charts.SUCCESS, width=2.5),
        marker=dict(size=6), name=f"Mejor: {best_cohort}",
    ))
    fig_compare.add_trace(go.Scatter(
        x=list(range(len(worst_data))), y=worst_data.values,
        mode="lines+markers",
        line=dict(color=charts.DANGER, width=2.5),
        marker=dict(size=6), name=f"Peor: {worst_cohort}",
    ))
    fig_compare.add_trace(go.Scatter(
        x=list(range(len(avg_curve))), y=avg_curve.values,
        mode="lines", line=dict(color=charts.TEXT_MUTED, width=1.5, dash="dash"),
        name="Promedio",
    ))
    fig_compare.update_layout(
        **charts._base_layout(), height=380,
        xaxis_title="Meses desde primera compra",
        yaxis_title=f"Retención de {label_suffix} (%)",
    )

    render_chart_container(
        "Mejor vs Peor Cohorte",
        f"Comparación de la cohorte con mayor y menor retención acumulada (meses 1-6)",
        fig_compare,
        interpretation=(
            f"La cohorte {best_cohort} muestra la mejor retención, mientras que "
            f"{worst_cohort} tiene la peor. La línea punteada es el promedio general. "
            "Investigar qué condiciones de mercado o campañas diferenciaron estas cohortes "
            "puede revelar palancas accionables."
        ),
        source_text="Fuente: Olist E-Commerce Dataset",
    )

# -- Chart 4: Kaplan-Meier survival curve --
if survival is not None and len(survival) > 0:
    from lifelines import KaplanMeierFitter

    survival_clean = survival[
        survival["duration_days"].notna()
        & survival["event_observed"].notna()
        & (survival["duration_days"] > 0)
    ].copy()

    kmf = KaplanMeierFitter()
    kmf.fit(
        durations=survival_clean["duration_days"],
        event_observed=survival_clean["event_observed"],
    )

    km_df = kmf.survival_function_.reset_index()
    km_df.columns = ["Días", "Supervivencia"]

    ci = kmf.confidence_interval_survival_function_
    ci = ci.reset_index()
    ci.columns = ["Días", "CI_lower", "CI_upper"]

    fig_km = go.Figure()

    # CI band
    fig_km.add_trace(go.Scatter(
        x=ci["Días"].tolist() + ci["Días"].tolist()[::-1],
        y=ci["CI_upper"].tolist() + ci["CI_lower"].tolist()[::-1],
        fill="toself", fillcolor="rgba(37,99,235,0.10)",
        line=dict(color="rgba(0,0,0,0)"),
        showlegend=False, hoverinfo="skip",
    ))

    fig_km.add_trace(go.Scatter(
        x=km_df["Días"], y=km_df["Supervivencia"],
        mode="lines", line=dict(color=charts.ACCENT, width=2.5, shape="hv"),
        name="Kaplan-Meier",
    ))

    # Median survival
    median_surv = kmf.median_survival_time_
    if not np.isinf(median_surv):
        fig_km.add_hline(
            y=0.5, line_dash="dot", line_color=charts.TEXT_MUTED,
            annotation_text=f"Mediana: {median_surv:.0f} días",
            annotation_position="top right",
        )

    fig_km.update_layout(
        **charts._base_layout(), height=400,
        xaxis_title="Días desde primera compra",
        yaxis_title="Probabilidad de no recomprar",
        yaxis_range=[0, 1.05],
    )

    render_chart_container(
        "Curva de Supervivencia Kaplan-Meier",
        "Probabilidad de que un cliente NO haya realizado su segunda compra en función del tiempo",
        fig_km,
        interpretation=(
            "La curva de supervivencia muestra que la probabilidad de recompra se concentra "
            "en las primeras semanas. Después de ~6 meses sin comprar, la probabilidad de "
            "retorno es prácticamente nula. Esto sugiere una ventana crítica de reenganche "
            "de 30-60 días post-compra."
        ),
        source_text=f"Fuente: Olist E-Commerce Dataset | N = {len(survival):,} clientes",
    )

    render_insight_box(
        finding=(
            "La mayor parte del churn ocurre en los primeros 90 días. "
            "Los clientes que no regresan en este período tienen una probabilidad "
            "casi nula de recompra futura."
        ),
        recommendation=(
            "Diseñar un flujo automatizado de reenganche en 3 etapas: "
            "email de seguimiento a los 7 días post-entrega, incentivo personalizado "
            "a los 30 días, y último intento a los 60 días. "
            "Después de 90 días, reclasificar como churned."
        ),
    )

# -- Footer --
st.markdown(
    '<div class="dashboard-footer">'
    "Análisis de Cohortes -- Olist E-Commerce | Andrés González Ortega | "
    "Datos: Sep 2016 - Oct 2018 | N = 96,478 pedidos entregados"
    "</div>",
    unsafe_allow_html=True,
)
