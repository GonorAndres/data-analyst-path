"""Report generation endpoint -- produces PDF executive KPI report."""

from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io

from kpi_backend import data_loader
from kpi_backend.analytics_engine import (
    compute_health_score,
    detect_anomalies_zscore,
    exponential_smoothing_forecast,
    mrr_waterfall,
    traffic_light_status,
)
from kpi_backend.report_generator import generate_report

router = APIRouter()


def _safe_float(val) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


@router.get("/report/generate")
def generate_pdf_report(
    segment: Optional[str] = Query(None),
    start_month: Optional[str] = Query(None),
    end_month: Optional[str] = Query(None),
    lang: Optional[str] = Query("en"),
    sections: Optional[str] = Query(None, description="Comma-separated section names"),
):
    """Generate and return a PDF executive KPI report as a streaming download."""
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

    source = kpis_df if not kpis_df.empty else metrics_df
    if source.empty:
        return {"error": "No data available for report generation."}

    source = source.sort_values("month") if "month" in source.columns else source
    last_row = source.iloc[-1] if not source.empty else {}

    # Build metrics dict
    metrics = {k: _safe_float(last_row.get(k, 0)) for k in source.columns if k != "month"}

    # Health score
    health = compute_health_score(metrics)
    metrics["health_score"] = health

    # KPI cards for the table
    from kpi_backend.routers.overview import _KPI_DEFS, _fmt_value

    kpi_cards = []
    for defn in _KPI_DEFS:
        col = defn["col"]
        if col not in source.columns:
            continue
        value = _safe_float(last_row.get(col, 0))
        if len(source) >= 2:
            prev = _safe_float(source[col].iloc[-2])
            mom = (value - prev) / prev if prev != 0 else 0.0
        else:
            mom = 0.0
        if len(source) >= 13:
            yoy_val = _safe_float(source[col].iloc[-13])
            yoy = (value - yoy_val) / yoy_val if yoy_val != 0 else 0.0
        else:
            yoy = 0.0
        tl = traffic_light_status(value, defn["target"], defn["hib"])
        kpi_cards.append({
            "id": defn["id"],
            "name": defn["name"],
            "value": round(value, 4),
            "formatted": _fmt_value(value, defn["fmt"]),
            "change_mom": round(mom, 4),
            "change_yoy": round(yoy, 4),
            "traffic_light": tl,
            "target": defn["target"],
            "category": defn["cat"],
        })

    # Waterfall
    wf = mrr_waterfall(last_row)

    # Anomalies
    anomalies = []
    if "month" in source.columns:
        month_labels = source["month"].apply(
            lambda m: m.strftime("%Y-%m") if hasattr(m, "strftime") else str(m)
        )
    else:
        month_labels = None

    for col in ["mrr", "logo_churn_rate", "nps", "nrr", "cac"]:
        if col in source.columns:
            anoms = detect_anomalies_zscore(
                source[col].astype(float), index_labels=month_labels,
            )
            for a in anoms:
                a["metric"] = col
            anomalies.extend(anoms)

    # Forecast
    forecast_data = {}
    for col in ["mrr", "logo_churn_rate", "nps"]:
        if col in source.columns:
            forecast_data[col] = exponential_smoothing_forecast(
                source[col].astype(float), periods=6,
            )

    # Period
    if "month" in source.columns and not source.empty:
        months_sorted = source["month"].sort_values()
        period = {
            "start": months_sorted.iloc[0].strftime("%Y-%m"),
            "end": months_sorted.iloc[-1].strftime("%Y-%m"),
        }
    else:
        period = {"start": "", "end": ""}

    # Assemble data payload
    report_data = {
        "metrics": metrics,
        "kpis": kpi_cards,
        "waterfall": wf,
        "anomalies": anomalies,
        "forecast": forecast_data,
        "customer_data": metrics,
        "period": period,
    }

    # Parse sections parameter
    section_list = None
    if sections:
        section_list = [s.strip() for s in sections.split(",") if s.strip()]

    # Generate PDF
    pdf_bytes = generate_report(report_data, lang=lang or "en", sections=section_list)

    filename = f"kpi_report_{period.get('end', 'latest')}_{lang}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
