"""Customers endpoint -- churn, NPS, NRR, support tickets, Lorenz curve."""

from typing import Optional

from fastapi import APIRouter, Query

from kpi_backend import data_loader
from kpi_backend.analytics_engine import customer_concentration_lorenz
from kpi_backend.commentary import generate_customer_commentary

router = APIRouter()


def _safe_float(val) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


@router.get("/customers")
def customers(
    segment: Optional[str] = Query(None),
    start_month: Optional[str] = Query(None),
    end_month: Optional[str] = Query(None),
    lang: Optional[str] = Query("en"),
):
    """Return customer health metrics: churn, NPS, NRR, support, Lorenz curve."""
    kpis_df = data_loader.apply_filters(
        data_loader.monthly_kpis,
        start_month=start_month,
        end_month=end_month,
    )
    metrics_df = data_loader.apply_filters(
        data_loader.monthly_metrics,
        start_month=start_month,
        end_month=end_month,
    )
    seg_df = data_loader.apply_filters(
        data_loader.segment_metrics,
        segment=segment,
        start_month=start_month,
        end_month=end_month,
    )

    source = metrics_df if not metrics_df.empty else kpis_df
    if source.empty:
        return {"error": "No data matches the selected filters."}

    source = source.sort_values("month") if "month" in source.columns else source

    def _month_str(m):
        return m.strftime("%Y-%m") if hasattr(m, "strftime") else str(m)

    # ── Combined churn trend (logo + revenue in one array) ──────
    churn_trend = []
    for _, row in source.iterrows():
        churn_trend.append({
            "month": _month_str(row["month"]),
            "logo_churn": round(_safe_float(row.get("logo_churn_rate", 0)), 4),
            "revenue_churn": round(_safe_float(row.get("revenue_churn_rate", 0)), 4),
        })

    # ── NRR trend ─────────────────────────────────────────────────
    nrr_col = "nrr" if "nrr" in source.columns else "net_revenue_retention"
    nrr_trend = []
    if nrr_col in source.columns:
        for _, row in source.iterrows():
            nrr_trend.append({
                "month": _month_str(row["month"]),
                "nrr": round(_safe_float(row.get(nrr_col, 0)), 4),
            })

    # ── NPS trend ─────────────────────────────────────────────────
    nps_trend = []
    if "nps" in source.columns:
        for _, row in source.iterrows():
            nps_trend.append({
                "month": _month_str(row["month"]),
                "nps": round(_safe_float(row.get("nps", 0)), 1),
            })

    # ── Support tickets (combined tickets + resolution hours) ────
    support_tickets = []
    if "support_tickets" in source.columns:
        for _, row in source.iterrows():
            support_tickets.append({
                "month": _month_str(row["month"]),
                "tickets": int(_safe_float(row.get("support_tickets", 0))),
                "resolution_hours": round(_safe_float(row.get("avg_resolution_hours", 0)), 1),
            })

    # ── Lorenz curve as LorenzPoint[] ─────────────────────────────
    lorenz_curve = []
    if not seg_df.empty and "segment" in seg_df.columns:
        if "month" in seg_df.columns:
            latest_month = seg_df["month"].max()
            latest_seg = seg_df[seg_df["month"] == latest_month]
        else:
            latest_seg = seg_df

        rev_col = "mrr" if "mrr" in latest_seg.columns else "revenue"
        cust_col = "customers" if "customers" in latest_seg.columns else "total_customers"

        if rev_col in latest_seg.columns and cust_col in latest_seg.columns:
            segments_data = []
            for _, row in latest_seg.iterrows():
                segments_data.append({
                    "segment": str(row["segment"]),
                    "revenue": _safe_float(row.get(rev_col, 0)),
                    "customers": int(_safe_float(row.get(cust_col, 0))),
                })
            lorenz_raw = customer_concentration_lorenz(segments_data)
            # Convert to LorenzPoint[] format
            pcts = lorenz_raw.get("percentiles", [])
            shares = lorenz_raw.get("cumulative_revenue_share", [])
            lorenz_curve = [{"pct_customers": 0, "pct_revenue": 0}]
            for p, s in zip(pcts, shares):
                lorenz_curve.append({
                    "pct_customers": round(p * 100, 1),
                    "pct_revenue": round(s * 100, 1),
                })

    # ── Commentary ────────────────────────────────────────────────
    last_row = source.iloc[-1] if not source.empty else {}
    cust_data = {k: _safe_float(last_row.get(k, 0)) for k in source.columns if k != "month"}
    commentary = generate_customer_commentary(cust_data, lang=lang or "en")

    return {
        "churn_trend": churn_trend,
        "nrr_trend": nrr_trend,
        "nps_trend": nps_trend,
        "lorenz_curve": lorenz_curve,
        "support_tickets": support_tickets,
        "commentary": commentary,
    }
