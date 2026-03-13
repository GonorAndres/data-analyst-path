"""Overview endpoint -- high-level KPI health dashboard."""

from typing import Optional

from fastapi import APIRouter, Query

from kpi_backend import data_loader
from kpi_backend.analytics_engine import (
    compute_health_score,
    traffic_light_status,
)
from kpi_backend.commentary import generate_executive_summary

router = APIRouter()

# KPI definitions: id, name, column, target, higher_is_better, category, format_fn
_KPI_DEFS = [
    {"id": "mrr", "name": "MRR", "col": "mrr", "target": 950_000, "hib": True, "cat": "revenue", "fmt": "currency"},
    {"id": "arr", "name": "ARR", "col": "arr", "target": 11_400_000, "hib": True, "cat": "revenue", "fmt": "currency"},
    {"id": "nrr", "name": "NRR", "col": "nrr", "target": 1.10, "hib": True, "cat": "revenue", "fmt": "pct"},
    {"id": "logo_churn_rate", "name": "Logo Churn", "col": "logo_churn_rate", "target": 0.02, "hib": False, "cat": "customers", "fmt": "pct"},
    {"id": "revenue_churn_rate", "name": "Revenue Churn", "col": "revenue_churn_rate", "target": 0.015, "hib": False, "cat": "customers", "fmt": "pct"},
    {"id": "nps", "name": "NPS", "col": "nps", "target": 55, "hib": True, "cat": "customers", "fmt": "int"},
    {"id": "ltv_cac_ratio", "name": "LTV:CAC", "col": "ltv_cac_ratio", "target": 3.5, "hib": True, "cat": "efficiency", "fmt": "ratio"},
    {"id": "rule_of_40", "name": "Rule of 40", "col": "rule_of_40", "target": 40, "hib": True, "cat": "efficiency", "fmt": "int"},
    {"id": "gross_margin", "name": "Gross Margin", "col": "gross_margin", "target": 0.75, "hib": True, "cat": "efficiency", "fmt": "pct"},
    {"id": "dau_mau_ratio", "name": "DAU/MAU", "col": "dau_mau_ratio", "target": 0.25, "hib": True, "cat": "engagement", "fmt": "pct"},
    {"id": "cac", "name": "CAC", "col": "cac", "target": 800, "hib": False, "cat": "efficiency", "fmt": "currency"},
    {"id": "payback_months", "name": "Payback Period", "col": "payback_months", "target": 12, "hib": False, "cat": "efficiency", "fmt": "months"},
]


def _fmt_value(value: float, fmt: str) -> str:
    """Format a KPI value for display."""
    if fmt == "currency":
        if abs(value) >= 1_000_000:
            return f"${value / 1_000_000:,.1f}M"
        elif abs(value) >= 1_000:
            return f"${value / 1_000:,.0f}K"
        return f"${value:,.0f}"
    elif fmt == "pct":
        if abs(value) <= 1:
            return f"{value * 100:.1f}%"
        return f"{value:.1f}%"
    elif fmt == "ratio":
        return f"{value:.1f}x"
    elif fmt == "months":
        return f"{value:.0f} mo"
    elif fmt == "int":
        return f"{value:.0f}"
    return str(value)


def _safe_float(val) -> float:
    """Convert a value to float, handling numpy types."""
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


@router.get("/overview")
def overview(
    segment: Optional[str] = Query(None),
    start_month: Optional[str] = Query(None),
    end_month: Optional[str] = Query(None),
    lang: Optional[str] = Query("en"),
):
    """Return the top-level KPI health dashboard."""
    kpis_df = data_loader.apply_filters(
        data_loader.monthly_kpis,
        segment=None,  # monthly_kpis is already aggregated
        start_month=start_month,
        end_month=end_month,
    )
    metrics_df = data_loader.apply_filters(
        data_loader.monthly_metrics,
        segment=None,
        start_month=start_month,
        end_month=end_month,
    )

    if kpis_df.empty and metrics_df.empty:
        return {"error": "No data matches the selected filters."}

    # Use whichever DataFrame has the data; prefer monthly_kpis
    source = kpis_df if not kpis_df.empty else metrics_df
    source = source.sort_values("month") if "month" in source.columns else source

    last_row = source.iloc[-1] if not source.empty else {}

    # Build KPI cards
    kpi_cards = []
    for defn in _KPI_DEFS:
        col = defn["col"]
        if col not in source.columns:
            continue

        value = _safe_float(last_row.get(col, 0))
        sparkline = [_safe_float(v) for v in source[col].tolist()] if col in source.columns else []

        # Month-over-month change
        if len(source) >= 2:
            prev_val = _safe_float(source[col].iloc[-2])
            change_mom = (value - prev_val) / prev_val if prev_val != 0 else 0.0
        else:
            change_mom = 0.0

        # Year-over-year change
        if len(source) >= 13:
            yoy_val = _safe_float(source[col].iloc[-13])
            change_yoy = (value - yoy_val) / yoy_val if yoy_val != 0 else 0.0
        else:
            change_yoy = 0.0

        tl = traffic_light_status(value, defn["target"], defn["hib"])

        kpi_cards.append({
            "id": defn["id"],
            "name": defn["name"],
            "value": round(value, 4),
            "formatted": _fmt_value(value, defn["fmt"]),
            "change_mom": round(change_mom, 4),
            "change_yoy": round(change_yoy, 4),
            "traffic_light": tl,
            "target": defn["target"],
            "sparkline": sparkline,
            "category": defn["cat"],
        })

    # Health score
    metrics_dict = {col: _safe_float(last_row.get(col, 0)) for col in source.columns if col != "month"}
    health = compute_health_score(metrics_dict)
    health_status = "green" if health >= 75 else "yellow" if health >= 50 else "red"

    # Commentary
    metrics_dict["health_score"] = health
    commentary = generate_executive_summary(metrics_dict, lang=lang or "en")

    # Period info
    if "month" in source.columns and not source.empty:
        months_sorted = source["month"].sort_values()
        period_start = months_sorted.iloc[0].strftime("%Y-%m")
        period_end = months_sorted.iloc[-1].strftime("%Y-%m")
        last_month = period_end
    else:
        period_start = ""
        period_end = ""
        last_month = ""

    return {
        "health_score": health,
        "health_status": health_status,
        "kpis": kpi_cards,
        "commentary": commentary,
        "period": {"start": period_start, "end": period_end},
        "last_month": last_month,
    }
