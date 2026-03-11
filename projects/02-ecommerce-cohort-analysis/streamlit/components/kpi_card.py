"""KPI card component with delta indicator."""

import streamlit as st


def render_kpi_card(label, value, delta=None, delta_color="normal",
                    prefix="", suffix="", border_color="#2563EB", subtitle=""):
    delta_html = ""
    if delta is not None:
        if delta_color == "inverse":
            css_class = "kpi-delta-down" if delta > 0 else "kpi-delta-up"
        elif delta_color == "off":
            css_class = "kpi-delta-neutral"
        else:
            css_class = "kpi-delta-up" if delta >= 0 else "kpi-delta-down"
        arrow = "▲" if delta >= 0 else "▼"
        delta_html = f'<div class="{css_class}">{arrow} {abs(delta):.1f}%</div>'

    subtitle_html = f'<div class="kpi-subtitle">{subtitle}</div>' if subtitle else ""

    st.markdown(
        f"""
        <div class="kpi-card" style="border-left-color: {border_color};">
            <div class="kpi-label">{label}</div>
            <div class="kpi-value">{prefix}{value}{suffix}</div>
            {subtitle_html}
            {delta_html}
        </div>
        """,
        unsafe_allow_html=True,
    )
