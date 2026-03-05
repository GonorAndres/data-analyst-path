"""Chart container with title, subtitle, interpretation, and source."""

import streamlit as st


def render_chart_container(title, subtitle, fig, interpretation="", source_text=""):
    st.markdown(
        f"""
        <div class="chart-container">
            <div class="chart-title">{title}</div>
            <div class="chart-subtitle">{subtitle}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})
    if interpretation or source_text:
        interp_html = f'<div class="chart-interpretation">{interpretation}</div>' if interpretation else ""
        source_html = f'<div class="chart-source">{source_text}</div>' if source_text else ""
        st.markdown(
            f"""<div style="margin-top:-16px;">{interp_html}{source_html}</div>""",
            unsafe_allow_html=True,
        )
