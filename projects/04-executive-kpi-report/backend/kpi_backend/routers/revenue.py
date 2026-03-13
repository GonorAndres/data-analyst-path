"""Revenue analysis endpoint -- MRR waterfall, ARR trend, segment breakdown."""

from typing import Optional

from fastapi import APIRouter, Query

from kpi_backend import data_loader
from kpi_backend.analytics_engine import mrr_waterfall
from kpi_backend.commentary import generate_revenue_commentary

router = APIRouter()


def _safe_float(val) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


@router.get("/revenue")
def revenue(
    segment: Optional[str] = Query(None),
    start_month: Optional[str] = Query(None),
    end_month: Optional[str] = Query(None),
    lang: Optional[str] = Query("en"),
):
    """Return revenue analysis: MRR waterfall, ARR trend, NRR, segment breakdown."""
    metrics_df = data_loader.apply_filters(
        data_loader.monthly_metrics,
        start_month=start_month,
        end_month=end_month,
    )
    kpis_df = data_loader.apply_filters(
        data_loader.monthly_kpis,
        start_month=start_month,
        end_month=end_month,
    )
    seg_df = data_loader.apply_filters(
        data_loader.segment_metrics,
        segment=segment,
        start_month=start_month,
        end_month=end_month,
    )

    if metrics_df.empty and kpis_df.empty:
        return {"error": "No data matches the selected filters."}

    source = metrics_df if not metrics_df.empty else kpis_df
    source = source.sort_values("month") if "month" in source.columns else source

    def _month_str(m):
        return m.strftime("%Y-%m") if hasattr(m, "strftime") else str(m)

    # ── ARR trend ──────────────────────────────────────────────────
    arr_trend = []
    for _, row in source.iterrows():
        arr_val = _safe_float(row.get("arr", 0)) or _safe_float(row.get("mrr", 0)) * 12
        arr_trend.append({
            "month": _month_str(row["month"]),
            "arr": round(arr_val, 2),
            "target": None,
        })

    # ── NRR trend ──────────────────────────────────────────────────
    nrr_col = "nrr" if "nrr" in source.columns else "net_revenue_retention"
    nrr_trend = []
    if nrr_col in source.columns:
        for _, row in source.iterrows():
            nrr_trend.append({
                "month": _month_str(row["month"]),
                "nrr": round(_safe_float(row.get(nrr_col, 0)), 4),
            })

    # ── MRR waterfall (latest month) as WaterfallItem[] ─────────
    last_row = source.iloc[-1] if not source.empty else {}
    wf_raw = mrr_waterfall(last_row)
    waterfall = [
        {"name": "Starting MRR", "value": wf_raw.get("starting_mrr", 0), "type": "start"},
        {"name": "New", "value": wf_raw.get("new", 0), "type": "positive"},
        {"name": "Expansion", "value": wf_raw.get("expansion", 0), "type": "positive"},
        {"name": "Contraction", "value": -abs(wf_raw.get("contraction", 0)), "type": "negative"},
        {"name": "Churned", "value": -abs(wf_raw.get("churned", 0)), "type": "negative"},
        {"name": "Ending MRR", "value": wf_raw.get("ending_mrr", 0), "type": "end"},
    ]

    # ── Segment breakdown (time series for stacked area) ─────────
    segment_breakdown = []
    if not seg_df.empty and "segment" in seg_df.columns:
        import pandas as pd
        rev_col = "mrr" if "mrr" in seg_df.columns else "revenue"
        if rev_col in seg_df.columns and "month" in seg_df.columns:
            pivot = seg_df.pivot_table(
                index="month", columns="segment", values=rev_col, aggfunc="sum"
            ).reset_index().sort_values("month")
            for _, row in pivot.iterrows():
                point = {"month": _month_str(row["month"])}
                for seg in pivot.columns:
                    if seg != "month":
                        point[seg] = round(_safe_float(row[seg]), 2)
                segment_breakdown.append(point)

    # ── MRR movements table ──────────────────────────────────────
    mrr_movements = []
    needed = {"new_mrr", "expansion_mrr", "contraction_mrr", "churned_mrr"}
    if needed.issubset(set(source.columns)):
        for i, (_, row) in enumerate(source.iterrows()):
            prev_mrr = _safe_float(source.iloc[i - 1]["mrr"]) if i > 0 else _safe_float(row["mrr"]) - _safe_float(row.get("new_mrr", 0)) - _safe_float(row.get("expansion_mrr", 0)) + abs(_safe_float(row.get("contraction_mrr", 0))) + abs(_safe_float(row.get("churned_mrr", 0)))
            mrr_movements.append({
                "month": _month_str(row["month"]),
                "starting": round(prev_mrr, 2),
                "new": round(_safe_float(row.get("new_mrr", 0)), 2),
                "expansion": round(_safe_float(row.get("expansion_mrr", 0)), 2),
                "contraction": round(abs(_safe_float(row.get("contraction_mrr", 0))), 2),
                "churned": round(abs(_safe_float(row.get("churned_mrr", 0))), 2),
                "ending": round(_safe_float(row["mrr"]), 2),
            })

    # ── Commentary ────────────────────────────────────────────────
    rev_data = {k: _safe_float(last_row.get(k, 0)) for k in source.columns if k != "month"} if not source.empty else {}
    commentary = generate_revenue_commentary(rev_data, lang=lang or "en")

    return {
        "waterfall": waterfall,
        "arr_trend": arr_trend,
        "segment_breakdown": segment_breakdown,
        "nrr_trend": nrr_trend,
        "mrr_movements": mrr_movements,
        "commentary": commentary,
    }
