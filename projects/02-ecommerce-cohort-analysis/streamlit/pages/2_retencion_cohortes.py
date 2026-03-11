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
from utils.filters import apply_cohort_size_filter, apply_date_filter_cohorts, render_active_filter_badges, render_dynamic_footer
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

render_active_filter_badges()

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
else:
    data = revenue_ret.copy() if revenue_ret is not None else retention.copy()
    label_suffix = "ingresos"

# Convert to percentages
data_pct = data.div(data.iloc[:, 0], axis=0) * 100

# Apply date filter to cohort index, then cohort size filter
data_pct = apply_date_filter_cohorts(data_pct)
retention_date = apply_date_filter_cohorts(retention)
data_pct_filtered = apply_cohort_size_filter(data_pct, retention_date)

if len(data_pct_filtered) == 0:
    min_size = st.session_state.get("min_cohort_size", 50)
    st.warning(f"No hay cohortes con >= {min_size} clientes en el mes 0. Reduce el filtro en la barra lateral.")
    st.stop()

# -- Tabs --
tab_heat, tab_prom, tab_comp, tab_km = st.tabs([
    "Heatmap", "Curva Promedio", "Mejor vs Peor", "Kaplan-Meier"
])

# ---- TAB 1: Heatmap ----
with tab_heat:
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

    avg_m1 = data_pct_filtered.iloc[:, 1].mean() if data_pct_filtered.shape[1] > 1 else 0
    avg_m3 = data_pct_filtered.iloc[:, 3].mean() if data_pct_filtered.shape[1] > 3 else 0

    render_chart_container(
        f"Heatmap de Retención por {label_suffix.title()}",
        f"Porcentaje de {label_suffix} retenidos en cada mes relativo a la cohorte",
        fig_heatmap,
        interpretation=(
            f"<ul>"
            f"<li>Retención promedio al mes 1: <strong>{avg_m1:.1f}%</strong> | mes 3: <strong>{avg_m3:.1f}%</strong></li>"
            f"<li>La caída más pronunciada ocurre entre el <strong>mes 0 y el mes 1</strong></li>"
            f"</ul>"
        ),
        source_text=f"Fuente: Olist E-Commerce Dataset | Cohortes filtradas por tamaño mínimo",
    )

    # Download
    retention_csv = data_pct_filtered.reset_index()
    st.download_button(
        "Descargar matriz de retención",
        retention_csv.to_csv(index=False).encode("utf-8"),
        "matriz_retencion.csv",
        "text/csv",
    )

# ---- TAB 2: Curva Promedio ----
with tab_prom:
    avg_curve = data_pct_filtered.iloc[:, :13].mean(axis=0)
    std_curve = data_pct_filtered.iloc[:, :13].std(axis=0)
    n_cohorts = len(data_pct_filtered)
    se = std_curve / np.sqrt(n_cohorts)
    ci_upper = avg_curve + 1.96 * se
    ci_lower = (avg_curve - 1.96 * se).clip(lower=0)

    fig_curve = go.Figure()

    for idx_name in data_pct_filtered.index:
        row = data_pct_filtered.loc[idx_name].iloc[:13]
        fig_curve.add_trace(go.Scatter(
            x=list(range(len(row))), y=row.values,
            mode="lines", line=dict(color="rgba(37,99,235,0.08)", width=1),
            showlegend=False, hoverinfo="skip",
        ))

    fig_curve.add_trace(go.Scatter(
        x=list(range(len(ci_upper))) + list(range(len(ci_lower)))[::-1],
        y=ci_upper.tolist() + ci_lower.tolist()[::-1],
        fill="toself", fillcolor="rgba(37,99,235,0.12)",
        line=dict(color="rgba(0,0,0,0)"),
        showlegend=False, hoverinfo="skip",
    ))

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
            "<ul>"
            "<li>Líneas tenues = cohortes individuales</li>"
            "<li>Banda azul = intervalo de confianza del 95%</li>"
            "<li>La retención se estabiliza después del <strong>mes 3-4</strong></li>"
            "</ul>"
        ),
        source_text=f"Fuente: Olist E-Commerce Dataset | N = {n_cohorts} cohortes",
    )

# ---- TAB 3: Mejor vs Peor + Overlay ----
with tab_comp:
    retention_quality = data_pct_filtered.iloc[:, 1:7].sum(axis=1)

    # Cohort overlay comparator
    cohort_options = [str(c) for c in data_pct_filtered.index.tolist()]
    selected_overlay = st.multiselect(
        "Selecciona cohortes para comparar",
        options=cohort_options,
        default=[],
        max_selections=4,
        help="Selecciona hasta 4 cohortes para superponer sus curvas",
    )

    if len(retention_quality) >= 2:
        best_cohort = retention_quality.idxmax()
        worst_cohort = retention_quality.idxmin()

        avg_curve_tab3 = data_pct_filtered.iloc[:, :13].mean(axis=0)

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
            x=list(range(len(avg_curve_tab3))), y=avg_curve_tab3.values,
            mode="lines", line=dict(color=charts.TEXT_MUTED, width=1.5, dash="dash"),
            name="Promedio",
        ))

        # Overlay selected cohorts
        for i, sel in enumerate(selected_overlay):
            try:
                # Try to match the cohort key
                sel_key = None
                for idx in data_pct_filtered.index:
                    if str(idx) == sel:
                        sel_key = idx
                        break
                if sel_key is not None:
                    sel_data = data_pct_filtered.loc[sel_key].iloc[:13]
                    fig_compare.add_trace(go.Scatter(
                        x=list(range(len(sel_data))), y=sel_data.values,
                        mode="lines+markers",
                        line=dict(color=charts.CATEGORICAL[i % len(charts.CATEGORICAL)], width=2, dash="dot"),
                        marker=dict(size=5),
                        name=f"Overlay: {sel}",
                    ))
            except Exception:
                pass

        fig_compare.update_layout(
            **charts._base_layout(), height=400,
            xaxis_title="Meses desde primera compra",
            yaxis_title=f"Retención de {label_suffix} (%)",
        )

        render_chart_container(
            "Mejor vs Peor Cohorte",
            "Comparación de la cohorte con mayor y menor retención acumulada (meses 1-6)",
            fig_compare,
            interpretation=(
                f'<div style="display:flex; gap:24px; flex-wrap:wrap;">'
                f'<div><span style="color:{charts.SUCCESS}; font-weight:700;">Mejor:</span> {best_cohort}</div>'
                f'<div><span style="color:{charts.DANGER}; font-weight:700;">Peor:</span> {worst_cohort}</div>'
                f'</div>'
            ),
            source_text="Fuente: Olist E-Commerce Dataset",
        )

# ---- TAB 4: Kaplan-Meier ----
with tab_km:
    if survival is not None and len(survival) > 0:
        from lifelines import KaplanMeierFitter

        survival_clean = survival[
            survival["duration_days"].notna()
            & survival["event_observed"].notna()
            & (survival["duration_days"] > 0)
        ].copy()

        # Segmentation radio
        seg_options = ["Ninguno"]
        if "payment_type" in survival_clean.columns:
            seg_options.append("payment_type")
        if "customer_state" in survival_clean.columns:
            seg_options.append("customer_state")

        km_seg = st.radio(
            "Segmentar curva de supervivencia por",
            options=seg_options,
            horizontal=True,
        )

        fig_km = go.Figure()

        if km_seg == "Ninguno":
            kmf = KaplanMeierFitter()
            kmf.fit(
                durations=survival_clean["duration_days"],
                event_observed=survival_clean["event_observed"],
            )
            km_df = kmf.survival_function_.reset_index()
            km_df.columns = ["Días", "Supervivencia"]
            ci = kmf.confidence_interval_survival_function_.reset_index()
            ci.columns = ["Días", "CI_lower", "CI_upper"]

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
            median_surv = kmf.median_survival_time_
            if not np.isinf(median_surv):
                fig_km.add_hline(
                    y=0.5, line_dash="dot", line_color=charts.TEXT_MUTED,
                    annotation_text=f"Mediana: {median_surv:.0f} días",
                    annotation_position="top right",
                )
            km_interp = (
                "<ul>"
                "<li>La probabilidad de recompra se concentra en las <strong>primeras semanas</strong></li>"
                "<li>Después de ~6 meses, la probabilidad de retorno es prácticamente nula</li>"
                "</ul>"
            )
        else:
            # Segmented KM
            top_vals = survival_clean[km_seg].value_counts().head(4).index.tolist()
            colors_km = charts.CATEGORICAL[:len(top_vals)]
            for i, val in enumerate(top_vals):
                sub = survival_clean[survival_clean[km_seg] == val]
                if len(sub) < 10:
                    continue
                kmf_sub = KaplanMeierFitter()
                kmf_sub.fit(
                    durations=sub["duration_days"],
                    event_observed=sub["event_observed"],
                    label=str(val),
                )
                km_sub = kmf_sub.survival_function_.reset_index()
                km_sub.columns = ["Días", "Supervivencia"]
                fig_km.add_trace(go.Scatter(
                    x=km_sub["Días"], y=km_sub["Supervivencia"],
                    mode="lines", line=dict(color=colors_km[i], width=2.5, shape="hv"),
                    name=str(val),
                ))
            km_interp = (
                "<ul>"
                f"<li>Segmentación por <strong>'{km_seg}'</strong></li>"
                "<li>Las diferencias entre grupos revelan el impacto de esta variable en el tiempo hasta la recompra</li>"
                "</ul>"
            )

        fig_km.update_layout(
            **charts._base_layout(), height=420,
            xaxis_title="Días desde primera compra",
            yaxis_title="Probabilidad de no recomprar",
            yaxis_range=[0, 1.05],
        )

        render_chart_container(
            "Curva de Supervivencia Kaplan-Meier",
            "Probabilidad de que un cliente NO haya realizado su segunda compra",
            fig_km,
            interpretation=km_interp,
            source_text=f"Fuente: Olist E-Commerce Dataset | N = {len(survival_clean):,} clientes",
        )

        render_insight_box(
            finding=(
                "<ul>"
                "<li>La mayor parte del churn ocurre en los <strong>primeros 90 días</strong></li>"
                "<li>Los clientes que no regresan en este período tienen probabilidad casi nula de recompra futura</li>"
                "</ul>"
            ),
            recommendation=(
                "<ol>"
                "<li><strong>7 días</strong> post-entrega: email de seguimiento</li>"
                "<li><strong>30 días</strong>: incentivo personalizado</li>"
                "<li><strong>60 días</strong>: último intento de reenganche</li>"
                "</ol>"
            ),
        )
    else:
        st.info("Datos de supervivencia no disponibles.")

# -- Footer --
render_dynamic_footer(None)
