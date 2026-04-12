"""Filter helper functions reading from st.session_state."""

from __future__ import annotations

import pandas as pd
import streamlit as st


def render_global_filters() -> None:
    """Render the global filter controls at the top of every page.

    Loads orders/customers/rfm once (cached), renders a compact row of
    filter widgets, and writes selected values into ``st.session_state``
    so downstream helpers can read them.
    """
    from utils.data_loader import load_orders, load_customers, load_rfm

    orders = load_orders()
    customers = load_customers()
    rfm = load_rfm()

    if orders is None:
        return

    min_date = orders["order_purchase_timestamp"].dt.date.min()
    max_date = orders["order_purchase_timestamp"].dt.date.max()

    # Determine how many columns we need
    has_segments = rfm is not None and "segment" in rfm.columns
    cols = st.columns([3, 2, 3] if has_segments else [3, 2])

    # -- Date range --
    with cols[0]:
        date_range = st.date_input(
            "Periodo de analisis",
            value=(
                st.session_state.get("date_start", min_date),
                st.session_state.get("date_end", max_date),
            ),
            min_value=min_date,
            max_value=max_date,
            key="_date_range_input",
        )
        if isinstance(date_range, (list, tuple)) and len(date_range) == 2:
            st.session_state["date_start"] = date_range[0]
            st.session_state["date_end"] = date_range[1]
        else:
            st.session_state["date_start"] = min_date
            st.session_state["date_end"] = max_date

    # -- Cohort size --
    with cols[1]:
        st.slider(
            "Cohorte minima",
            min_value=10,
            max_value=500,
            value=st.session_state.get("min_cohort_size", 50),
            step=10,
            key="min_cohort_size",
        )

    # -- Segment filter --
    if has_segments and rfm is not None:
        with cols[2]:
            all_segments = sorted(rfm["segment"].unique().tolist())
            st.multiselect(
                "Segmentos RFM",
                options=all_segments,
                default=st.session_state.get("selected_segments", []),
                key="selected_segments",
                placeholder="Todos los segmentos",
            )


def apply_date_filter(orders_df: pd.DataFrame) -> pd.DataFrame:
    """Filter orders_df by session_state date range."""
    start = st.session_state.get("date_start")
    end = st.session_state.get("date_end")
    if start is None or end is None:
        return orders_df
    mask = (
        (orders_df["order_purchase_timestamp"].dt.date >= start)
        & (orders_df["order_purchase_timestamp"].dt.date <= end)
    )
    return orders_df[mask].copy()


def apply_cohort_size_filter(retention_df: pd.DataFrame, raw_retention_df: pd.DataFrame) -> pd.DataFrame:
    """Filter retention_df to cohorts with min_cohort_size customers in month 0."""
    min_size = st.session_state.get("min_cohort_size", 50)
    valid = raw_retention_df.index[raw_retention_df.iloc[:, 0] >= min_size]
    return retention_df.loc[retention_df.index.isin(valid)]


def apply_segment_filter(rfm_df: pd.DataFrame) -> pd.DataFrame:
    """Filter rfm_df to selected segments. If empty/all, return full df."""
    selected = st.session_state.get("selected_segments", [])
    all_segs = rfm_df["segment"].unique().tolist()
    if not selected or set(selected) == set(all_segs):
        return rfm_df
    return rfm_df[rfm_df["segment"].isin(selected)].copy()


def apply_date_filter_customers(customers_df: pd.DataFrame) -> pd.DataFrame:
    """Filter customers_df by session_state date range on cohort_month."""
    start = st.session_state.get("date_start")
    end = st.session_state.get("date_end")
    if start is None or end is None or "cohort_month" not in customers_df.columns:
        return customers_df
    start_str = start.strftime("%Y-%m")
    end_str = end.strftime("%Y-%m")
    mask = (customers_df["cohort_month"] >= start_str) & (customers_df["cohort_month"] <= end_str)
    return customers_df[mask].copy()


def apply_date_filter_cohorts(retention_df: pd.DataFrame) -> pd.DataFrame:
    """Filter retention_df rows (cohort index as YYYY-MM strings) by session_state date range."""
    start = st.session_state.get("date_start")
    end = st.session_state.get("date_end")
    if start is None or end is None:
        return retention_df
    start_str = start.strftime("%Y-%m")
    end_str = end.strftime("%Y-%m")
    idx = retention_df.index.astype(str)
    mask = (idx >= start_str) & (idx <= end_str)
    return retention_df[mask].copy()


def render_active_filter_badges() -> None:
    """Render a compact filter bar showing all active sidebar filters."""
    badges: list[str] = []

    date_start = st.session_state.get("date_start")
    date_end = st.session_state.get("date_end")
    if date_start and date_end:
        badges.append(
            f'<span class="filter-badge">'
            f'<span class="filter-badge-icon">&#128197;</span> '
            f"{date_start.strftime('%b %Y')} &rarr; {date_end.strftime('%b %Y')}"
            f"</span>"
        )

    min_cohort = st.session_state.get("min_cohort_size", 50)
    if min_cohort != 50:
        badges.append(
            f'<span class="filter-badge">'
            f'<span class="filter-badge-icon">&#9998;</span> '
            f"Cohorte &ge; {min_cohort}"
            f"</span>"
        )

    selected_segs = st.session_state.get("selected_segments", [])
    if selected_segs:
        for s in selected_segs:
            badges.append(
                f'<span class="filter-badge">'
                f'<span class="filter-badge-icon">&#9679;</span> {s}'
                f"</span>"
            )

    if badges:
        inner = "".join(badges)
    else:
        inner = '<span class="filter-bar-empty">Sin filtros activos -- mostrando todos los datos</span>'

    st.markdown(
        f'<div class="filter-bar">'
        f'<span class="filter-bar-label">Filtros</span>'
        f"{inner}"
        f"</div>",
        unsafe_allow_html=True,
    )


def render_dynamic_footer(n_orders: int | None = None) -> None:
    """Render a dynamic footer with the active date range and optional order count."""
    date_start = st.session_state.get("date_start")
    date_end = st.session_state.get("date_end")
    if date_start and date_end:
        period = f"{date_start.strftime('%b %Y')} - {date_end.strftime('%b %Y')}"
    else:
        period = "Sep 2016 - Oct 2018"
    order_text = f" | N = {n_orders:,} pedidos entregados" if n_orders is not None else ""
    st.markdown(
        f'<div class="dashboard-footer">'
        f"Análisis de Cohortes -- Olist E-Commerce | Andrés González Ortega | "
        f"Datos: {period}{order_text}"
        f"</div>",
        unsafe_allow_html=True,
    )
