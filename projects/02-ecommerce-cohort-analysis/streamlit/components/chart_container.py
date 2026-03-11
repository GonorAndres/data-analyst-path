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
    if interpretation:
        st.markdown(
            f'<div class="chart-interpretation">{interpretation}</div>',
            unsafe_allow_html=True,
        )
    if source_text:
        st.caption(source_text)
