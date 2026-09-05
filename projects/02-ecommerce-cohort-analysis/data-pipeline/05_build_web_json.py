"""Build the static JSON the /cohorts dashboard reads.

The Streamlit app queried 36 MB of parquet at runtime, which is why it needed a
container. Its three filters -- date range, minimum cohort size, RFM segment --
turn out to be *subsets*, never recomputations: they select rows of an already
aggregated retention matrix, drop cohorts below a headcount, and filter customers
by segment name. Nothing recomputes from the 96,478 order rows.

So the same interactivity survives a static export, as long as the JSON is
pre-aggregated along the axes the filters cut on:

    cohort_month  -- the date filter and the cohort-size filter both act here
    segment       -- the RFM filter
    customer_state -- the geographic view

Everything else collapses to monthly or per-segment grain and is tiny. The two
per-customer datasets (93,358 rows each) never ship: the RFM scatter goes out as
a binned grid, and the survival curve as precomputed points.

Reads:  data/processed/*.parquet   (downloaded from gs://da-portfolio-data-assets)
Writes: ../../projects/02-.../web/public/cohorts/data/*.json

Usage:
    python data-pipeline/05_build_web_json.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
PROCESSED = HERE.parent / "data" / "processed"
OUT = HERE.parent / "web" / "public" / "cohorts" / "data"

# meta.json is also written into src/, where the page imports it directly. That
# copy is what lets the hero heading and dataset counts render in the static
# export instead of appearing only after the client fetch resolves -- the page is
# a portfolio piece, so it should say what it is before any JavaScript runs.
SRC_OUT = HERE.parents[2] / "apps" / "web" / "src" / "features" / "cohorts" / "data"

# English -> Spanish, matching the Streamlit app so the rebuild reads identically.
SEGMENT_ES = {
    "Champions": "Alto Valor",
    "Loyal": "Leales",
    "Potential Loyalist": "Potencial Leal",
    "New": "Nuevos",
    "Promising": "Prometedores",
    "Need Attention": "Requieren Atención",
    "At Risk": "En Riesgo",
    "Hibernating": "Inactivos",
    "Lost": "Perdidos",
    "Other": "Otros",
}


def _read(name: str) -> pd.DataFrame:
    return pd.read_parquet(PROCESSED / f"{name}.parquet")


def _round(value, digits: int = 2):
    """Round for the wire. Full float precision would roughly double the payload
    for digits nobody can see on a chart."""
    if value is None or (isinstance(value, float) and (np.isnan(value) or np.isinf(value))):
        return None
    return round(float(value), digits)


def _write(name: str, payload: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.json"
    # separators drop the whitespace; these files are read by machines only.
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    print(f"  {name + '.json':24} {path.stat().st_size / 1024:7.1f} KB")


def build_cohorts() -> None:
    """Retention and revenue matrices, shipped as raw counts.

    Counts rather than percentages because the cohort-size filter needs the
    month-0 headcount, and percentages are one division away in the client.
    """
    ret = _read("cohort_retention_matrix")
    rev = _read("cohort_revenue_retention")

    cohorts = [str(c) for c in ret.index]
    _write(
        "cohorts",
        {
            "cohorts": cohorts,
            "months": [int(c) for c in ret.columns],
            # rows[i][j] = customers from cohort i still active in month j
            "retention_counts": [[int(v) for v in row] for row in ret.to_numpy()],
            "revenue": [[_round(v) for v in row] for row in rev.to_numpy()],
        },
    )


def build_overview() -> None:
    """Monthly KPI series plus the per-cohort customer aggregates the KPI row needs.

    The KPI cards (customers, revenue, repeat rate, average LTV) all respond to
    the date filter, so they cannot be precomputed as four scalars -- they ship
    as per-cohort-month components the client sums over the selected range.
    """
    orders = _read("orders_enriched")
    customers = _read("customers_summary")

    monthly = (
        orders.groupby("order_month")
        .agg(revenue=("total_order_value", "sum"), orders=("order_id", "count"))
        .reset_index()
        .sort_values("order_month")
    )

    # Per cohort month: the pieces the KPI cards are built from. Summing these
    # over a date range reproduces the Streamlit figures exactly, because its
    # customer-side filter is also on cohort_month.
    #
    # orders_2/3/4 are the repeat-purchase funnel, as cumulative "reached at
    # least this many orders" counts. Cumulative rather than exact-N because the
    # funnel stages are thresholds, and because summing thresholds over a date
    # range is valid where summing ratios would not be -- the conversion rates
    # are divided in the client, after the range has been summed.
    customers = customers.assign(
        o2=customers["total_orders"] >= 2,
        o3=customers["total_orders"] >= 3,
        o4=customers["total_orders"] >= 4,
    )
    by_cohort = (
        customers.groupby("cohort_month")
        .agg(
            customers=("customer_unique_id", "count"),
            revenue=("total_revenue", "sum"),
            repeat_customers=("is_repeat_customer", "sum"),
            orders_2=("o2", "sum"),
            orders_3=("o3", "sum"),
            orders_4=("o4", "sum"),
        )
        .reset_index()
        .sort_values("cohort_month")
    )

    _write(
        "overview",
        {
            "monthly": [
                {"month": str(r.order_month), "revenue": _round(r.revenue), "orders": int(r.orders)}
                for r in monthly.itertuples()
            ],
            "by_cohort": [
                {
                    "cohort": str(r.cohort_month),
                    "customers": int(r.customers),
                    "revenue": _round(r.revenue),
                    "repeat": int(r.repeat_customers),
                    "orders_2": int(r.orders_2),
                    "orders_3": int(r.orders_3),
                    "orders_4": int(r.orders_4),
                }
                for r in by_cohort.itertuples()
            ],
        },
    )


def _lorenz(revenue: np.ndarray, points: int = 200) -> dict:
    """Revenue concentration: the Lorenz curve, its Gini, and the top-20% share.

    Computed over every customer, then downsampled for the wire. A Lorenz curve
    on 93,358 customers is 93,358 points describing a smooth monotone arc; 200
    evenly spaced samples are visually identical and 460x smaller. The Gini and
    the top-20% share are computed on the FULL array before downsampling, so the
    headline numbers are exact rather than sampled.

    Deliberately not responsive to the segment filter -- the Streamlit chart also
    uses the unfiltered population, because the concentration of revenue across
    the whole customer base is the claim being made. Filtering it to one segment
    would measure concentration *within* that segment, a different statistic.
    """
    revenue = np.sort(revenue[np.isfinite(revenue)])
    n = len(revenue)
    cum_revenue = np.cumsum(revenue) / revenue.sum()
    cum_population = np.arange(1, n + 1) / n

    # np.trapezoid is the NumPy 2 name; np.trapz is the deprecated alias.
    trapz = getattr(np, "trapezoid", None) or np.trapz
    gini = 1 - 2 * trapz(cum_revenue, cum_population)

    # Share held by the top 20%: total minus what the bottom 80% accumulated.
    top20_share = (1 - cum_revenue[int(0.8 * n)]) * 100

    idx = np.unique(np.linspace(0, n - 1, points).astype(int))
    return {
        "population": [_round(cum_population[i], 4) for i in idx],
        "revenue": [_round(cum_revenue[i], 4) for i in idx],
        "gini": _round(gini, 3),
        "top20_share": _round(top20_share, 1),
        "customers": int(n),
    }


def build_segments() -> None:
    """RFM segment aggregates and a binned scatter.

    The scatter in the Streamlit app plots 93,358 individual customers. At that
    density the points are a cloud, not 93,358 readable marks, so it ships as a
    recency x frequency grid with a count per cell -- the same shape, a fraction
    of the bytes, and it still filters by segment.
    """
    rfm = _read("rfm_segments")
    rfm["segment"] = rfm["segment"].map(SEGMENT_ES).fillna(rfm["segment"])

    by_segment = (
        rfm.groupby("segment")
        .agg(
            customers=("customer_unique_id", "count"),
            revenue=("total_revenue", "sum"),
            avg_recency=("recency_days", "mean"),
            avg_orders=("total_orders", "mean"),
            avg_revenue=("total_revenue", "mean"),
        )
        .reset_index()
        .sort_values("customers", ascending=False)
    )

    # 30-day recency buckets; frequency capped at 5+ where the tail is negligible.
    rfm["r_bin"] = (rfm["recency_days"] // 30 * 30).astype(int)
    rfm["f_bin"] = rfm["total_orders"].clip(upper=5).astype(int)
    scatter = (
        rfm.groupby(["segment", "r_bin", "f_bin"])
        .agg(count=("customer_unique_id", "count"), revenue=("total_revenue", "mean"))
        .reset_index()
    )

    ltv = _read("ltv_curves")
    ltv["segment"] = ltv["segment"].map(SEGMENT_ES).fillna(ltv["segment"])

    lorenz = _lorenz(rfm["total_revenue"].to_numpy())

    _write(
        "segments",
        {
            "lorenz": lorenz,
            "by_segment": [
                {
                    "segment": r.segment,
                    "customers": int(r.customers),
                    "revenue": _round(r.revenue),
                    "avg_recency": _round(r.avg_recency, 1),
                    "avg_orders": _round(r.avg_orders, 2),
                    "avg_revenue": _round(r.avg_revenue),
                }
                for r in by_segment.itertuples()
            ],
            "scatter": [
                {
                    "segment": r.segment,
                    "recency": int(r.r_bin),
                    "frequency": int(r.f_bin),
                    "count": int(r.count),
                    "avg_revenue": _round(r.revenue),
                }
                for r in scatter.itertuples()
            ],
            "ltv_curves": [
                {
                    "segment": r.segment,
                    "month": int(r.months_since_cohort),
                    "cumulative_revenue": _round(r.cumulative_revenue_per_customer),
                }
                for r in ltv.itertuples()
            ],
        },
    )


def build_geography() -> None:
    """Per-state aggregates, at (state x cohort_month) grain.

    Flattening to state alone would be smaller, but then the date filter could
    not move the rankings -- and in the Streamlit app it does.

    Two blocks, because the Streamlit page built its state table from two frames
    cut on two different axes: customer-side metrics (headcount, revenue, AOV,
    repeat rate) came from `customers_summary` filtered on cohort_month, while
    order-side metrics (order count, review score, delivery days) came from
    `orders_enriched` filtered on order_month. Collapsing them into one block
    would force one of the two to be summed over the wrong axis and quietly
    change the numbers. Both grains ship, and the client sums each over the
    matching range.

    Sums ship instead of means throughout -- `revenue_sum` with `customers`, not
    an average -- because a mean cannot be re-aggregated over a date range. The
    Streamlit AOV was a mean of per-customer averages, which this reproduces by
    carrying that mean's numerator (`aov_sum`) alongside its denominator.
    """
    customers = _read("customers_summary")
    orders = _read("orders_enriched")

    by_state_cohort = (
        customers.groupby(["customer_state", "cohort_month"])
        .agg(
            customers=("customer_unique_id", "count"),
            revenue=("total_revenue", "sum"),
            repeat_customers=("is_repeat_customer", "sum"),
            aov_sum=("avg_order_value", "sum"),
            recency_sum=("recency_days", "sum"),
            delivery_sum=("avg_delivery_days", "sum"),
            delivery_n=("avg_delivery_days", "count"),
            review_sum=("avg_review_score", "sum"),
            review_n=("avg_review_score", "count"),
        )
        .reset_index()
    )

    by_state_month = (
        orders.groupby(["customer_state", "order_month"])
        .agg(
            orders=("order_id", "nunique"),
            review_sum=("review_score", "sum"),
            review_n=("review_score", "count"),
            delivery_sum=("delivery_days", "sum"),
            delivery_n=("delivery_days", "count"),
        )
        .reset_index()
    )

    # Retention curves per state, at full (state x cohort x month-since) grain so
    # the chart still answers to the cohort filter. Restricted to states with at
    # least 100 customers and the first 12 months: below that headcount a
    # retention rate is a handful of people, and the matrix is sparse enough that
    # the full form is 59 KB rather than the 27 x 23 x 13 dense worst case.
    eligible = customers.groupby("customer_state").size()
    eligible = set(eligible[eligible >= 100].index)
    curves = (
        orders[orders["customer_state"].isin(eligible) & (orders["months_since_cohort"] <= 12)]
        .groupby(["customer_state", "cohort_month", "months_since_cohort"])["customer_unique_id"]
        .nunique()
        .reset_index(name="customers")
    )

    _write(
        "geography",
        {
            "by_state_cohort": [
                {
                    "state": r.customer_state,
                    "cohort": str(r.cohort_month),
                    "customers": int(r.customers),
                    "revenue": _round(r.revenue),
                    "repeat": int(r.repeat_customers),
                    "aov_sum": _round(r.aov_sum),
                    "recency_sum": _round(r.recency_sum, 1),
                    "delivery_sum": _round(r.delivery_sum, 1),
                    "delivery_n": int(r.delivery_n),
                    "review_sum": _round(r.review_sum, 2),
                    "review_n": int(r.review_n),
                }
                for r in by_state_cohort.itertuples()
            ],
            "by_state_month": [
                {
                    "state": r.customer_state,
                    "month": str(r.order_month),
                    "orders": int(r.orders),
                    "review_sum": _round(r.review_sum, 2),
                    "review_n": int(r.review_n),
                    "delivery_sum": _round(r.delivery_sum, 1),
                    "delivery_n": int(r.delivery_n),
                }
                for r in by_state_month.itertuples()
            ],
            "retention_curves": [
                {
                    "state": r.customer_state,
                    "cohort": str(r.cohort_month),
                    "month": int(r.months_since_cohort),
                    "customers": int(r.customers),
                }
                for r in curves.itertuples()
            ],
        },
    )


def _km(durations: np.ndarray, events: np.ndarray, grid: np.ndarray) -> dict:
    """Kaplan-Meier estimate with log-log confidence bounds, sampled onto `grid`.

    The product is taken over every distinct event time and only then sampled,
    rather than being accumulated bin by bin over the grid. Both give the same
    curve when no interval contains more than one event time, but only the exact
    form gives a correct risk set -- and the variance term is a sum over event
    times, so binning it first would bias the interval.

    Bounds follow the log-log ("exponential Greenwood") transform, which is what
    lifelines produces by default and therefore what the Streamlit chart showed.
    The plain-Greenwood form on S itself can stray outside [0, 1], which for a
    survival probability is not a defensible thing to draw.
    """
    order = np.argsort(durations, kind="stable")
    durations, events = durations[order], events[order]
    n = len(durations)

    event_times = np.unique(durations[events])
    times, surv, variance = [0.0], [1.0], [0.0]
    s, v = 1.0, 0.0

    for t in event_times:
        at_risk = int((durations >= t).sum())
        died = int(((durations == t) & events).sum())
        if at_risk <= 0 or died <= 0:
            continue
        s *= 1 - died / at_risk
        # Greenwood's variance term. When died == at_risk the summand is
        # undefined; S has hit 0 there, so the interval is degenerate anyway.
        if at_risk > died:
            v += died / (at_risk * (at_risk - died))
        times.append(float(t))
        surv.append(s)
        variance.append(v)

    times_a = np.asarray(times)
    surv_a = np.asarray(surv)
    var_a = np.asarray(variance)

    # Step function: the value at grid point g is the last estimate at or before g.
    idx = np.searchsorted(times_a, grid, side="right") - 1
    s_grid, v_grid = surv_a[idx], var_a[idx]

    # log-log bounds: S^exp(±1.96 sqrt(v) / log S). Undefined where S is exactly
    # 1 or 0, and there the curve carries no uncertainty worth drawing.
    with np.errstate(divide="ignore", invalid="ignore"):
        log_s = np.log(s_grid)
        theta = np.exp(1.96 * np.sqrt(v_grid) / np.abs(log_s))
        lower = np.where(np.isfinite(theta), s_grid**theta, s_grid)
        upper = np.where(np.isfinite(theta), s_grid ** (1 / theta), s_grid)
    degenerate = (s_grid >= 1) | (s_grid <= 0) | (v_grid <= 0)
    lower = np.where(degenerate, s_grid, np.clip(lower, 0, 1))
    upper = np.where(degenerate, s_grid, np.clip(upper, 0, 1))

    # The median is the first time S drops to 0.5 -- which for Olist never
    # happens, since ~97% of customers never place a second order and the curve
    # plateaus near 0.97. None, not a number, is the honest answer.
    below = np.flatnonzero(surv_a <= 0.5)
    median = float(times_a[below[0]]) if below.size else None

    return {
        "survival": [_round(x, 4) for x in s_grid],
        "ci_lower": [_round(x, 4) for x in lower],
        "ci_upper": [_round(x, 4) for x in upper],
        "n": int(n),
        "events": int(events.sum()),
        "median": median,
    }


def build_survival() -> None:
    """Kaplan-Meier curves, precomputed.

    Estimated here rather than in the browser: the estimator is a cumulative
    product over ordered event times, which is a poor thing to ask a client to
    redo on every filter change for a curve that never varies.

    The Streamlit page offered a radio to segment the curve by payment type or
    state. Both are precomputed here for the four largest groups -- the same cut
    the radio took -- since a handful of extra curves costs a few KB and the
    alternative is shipping 92,523 durations to re-fit in the client.
    """
    surv = _read("survival_data")
    surv = surv[surv["duration_days"].notna() & surv["event_observed"].notna()]
    surv = surv[surv["duration_days"] > 0]

    # Weekly grid to 720 days. Beyond two years the risk set is too thin to plot,
    # and weekly is finer than the curve's own resolution at this scale.
    grid = np.arange(0, 721, 7)
    durations = surv["duration_days"].to_numpy(dtype=float)
    events = surv["event_observed"].to_numpy().astype(bool)

    payload = {"days": [int(d) for d in grid], **_km(durations, events, grid)}

    for key, field in (("by_payment", "payment_type"), ("by_state", "state")):
        top = surv[field].value_counts().head(4).index.tolist()
        payload[key] = [
            {
                "group": str(value),
                **{
                    k: v
                    for k, v in _km(
                        sub["duration_days"].to_numpy(dtype=float),
                        sub["event_observed"].to_numpy().astype(bool),
                        grid,
                    ).items()
                    # The bands are dropped on the segmented curves: four
                    # overlapping ribbons obscure the very comparison the split
                    # is there to make. The aggregate curve keeps its interval.
                    if k not in ("ci_lower", "ci_upper")
                },
            }
            for value in top
            if len(sub := surv[surv[field] == value]) >= 10
        ]

    _write("survival", payload)


def build_activation() -> None:
    """Logistic-regression coefficients behind the repeat-purchase drivers chart."""
    act = _read("activation_coefficients")
    act = act[np.isfinite(act["coef"])].copy()
    # Unbounded confidence intervals plot as an arrow off the canvas; the chart
    # in the Streamlit app drops them and so does this.
    act = act[np.isfinite(act["ci_upper"]) & (act["ci_upper"] > 0)]
    act = act.sort_values("coef")

    _write(
        "activation",
        {
            "features": [
                {
                    "feature": r.feature,
                    "log2_odds": _round(np.log2(r.odds_ratio), 3),
                    "odds_ratio": _round(r.odds_ratio, 4),
                    "ci_lower": _round(np.log2(r.ci_lower) if r.ci_lower > 0 else None, 3),
                    "ci_upper": _round(np.log2(r.ci_upper), 3),
                    "p_value": _round(r.p_value, 6),
                    "significant": bool(r.p_value < 0.05),
                }
                for r in act.itertuples()
            ]
        },
    )


def build_meta() -> None:
    """Dataset-level facts the footer, methodology page and copy quote."""
    orders = _read("orders_enriched")
    customers = _read("customers_summary")

    _write(
        "meta",
        {
            "orders": int(len(orders)),
            "customers": int(len(customers)),
            "date_start": str(orders["order_purchase_timestamp"].min())[:10],
            "date_end": str(orders["order_purchase_timestamp"].max())[:10],
            "repeat_rate": _round(customers["is_repeat_customer"].mean() * 100, 2),
            "total_revenue": _round(customers["total_revenue"].sum()),
            "avg_ltv": _round(customers["total_revenue"].mean()),
            "states": int(customers["customer_state"].nunique()),
            "generated_from": "gs://da-portfolio-data-assets/cohort-processed",
        },
    )
    SRC_OUT.mkdir(parents=True, exist_ok=True)
    (SRC_OUT / "meta.json").write_text((OUT / "meta.json").read_text())


def main() -> None:
    print(f"reading  {PROCESSED}")
    print(f"writing  {OUT}\n")
    build_meta()
    build_overview()
    build_cohorts()
    build_segments()
    build_geography()
    build_survival()
    build_activation()

    total = sum(f.stat().st_size for f in OUT.glob("*.json"))
    print(f"\n  {'TOTAL':24} {total / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
