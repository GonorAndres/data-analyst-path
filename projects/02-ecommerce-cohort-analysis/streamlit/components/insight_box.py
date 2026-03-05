"""Insight box component for key findings and recommendations."""

import streamlit as st


def render_insight_box(finding, recommendation, box_type="insight"):
    css_class = {
        "insight": "",
        "success": " success",
        "warning": " warning",
    }.get(box_type, "")

    st.markdown(
        f"""
        <div class="insight-box{css_class}">
            <div class="insight-header">Hallazgo Clave</div>
            <div class="insight-finding">{finding}</div>
            <div class="insight-rec"><strong>Recomendación:</strong> {recommendation}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
