"""Render a row of KPI cards in columns."""

import streamlit as st
from components.kpi_card import render_kpi_card


def render_metric_row(metrics):
    """Render multiple KPI cards in a row.

    Args:
        metrics: list of dicts with keys matching render_kpi_card params
            (label, value, delta, delta_color, prefix, suffix, border_color)
    """
    cols = st.columns(len(metrics))
    for col, m in zip(cols, metrics):
        with col:
            render_kpi_card(
                label=m["label"],
                value=m["value"],
                delta=m.get("delta"),
                delta_color=m.get("delta_color", "normal"),
                prefix=m.get("prefix", ""),
                suffix=m.get("suffix", ""),
                border_color=m.get("border_color", "#2563EB"),
                subtitle=m.get("subtitle", ""),
            )
