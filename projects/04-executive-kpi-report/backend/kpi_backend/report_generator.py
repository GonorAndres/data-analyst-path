"""PDF report generation using fpdf2 with embedded plotly charts.

Generates a multi-section executive KPI report as a PDF byte stream.
"""

import io
import os
import tempfile
from datetime import datetime
from typing import Dict, List, Optional

import numpy as np

try:
    from fpdf import FPDF
except ImportError:
    FPDF = None  # type: ignore[assignment,misc]

from kpi_backend.commentary import (
    generate_anomaly_narrative,
    generate_customer_commentary,
    generate_executive_summary,
    generate_revenue_commentary,
)


# ═══════════════════════════════════════════════════════════════════════════
# CHART RENDERING HELPERS
# ═══════════════════════════════════════════════════════════════════════════


def _render_chart_png(fig) -> Optional[str]:
    """Render a plotly Figure to a temporary PNG file.

    Returns the temp file path or None if kaleido is unavailable.
    """
    try:
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        fig.write_image(tmp.name, width=700, height=350, scale=2)
        return tmp.name
    except Exception:
        return None


def _create_sparkline_chart(values: List[float], title: str = ""):
    """Create a minimal sparkline-style plotly chart."""
    try:
        import plotly.graph_objects as go

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            y=values,
            mode="lines",
            line=dict(color="#2563eb", width=2),
            fill="tozeroy",
            fillcolor="rgba(37,99,235,0.1)",
        ))
        fig.update_layout(
            title=title,
            title_font_size=14,
            margin=dict(l=40, r=20, t=40, b=30),
            height=250,
            width=700,
            showlegend=False,
            plot_bgcolor="white",
        )
        fig.update_xaxes(showgrid=False)
        fig.update_yaxes(showgrid=True, gridcolor="#f0f0f0")
        return fig
    except ImportError:
        return None


def _create_waterfall_chart(waterfall: Dict):
    """Create a waterfall chart for MRR components."""
    try:
        import plotly.graph_objects as go

        categories = ["Starting MRR", "New", "Expansion", "Contraction", "Churned", "Ending MRR"]
        values = [
            waterfall["starting_mrr"],
            waterfall["new"],
            waterfall["expansion"],
            -waterfall["contraction"],
            -waterfall["churned"],
            waterfall["ending_mrr"],
        ]
        measures = ["absolute", "relative", "relative", "relative", "relative", "total"]
        colors = ["#6b7280", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#2563eb"]

        fig = go.Figure(go.Waterfall(
            x=categories,
            y=values,
            measure=measures,
            connector=dict(line=dict(color="#d1d5db")),
            increasing=dict(marker=dict(color="#22c55e")),
            decreasing=dict(marker=dict(color="#ef4444")),
            totals=dict(marker=dict(color="#2563eb")),
        ))
        fig.update_layout(
            title="MRR Waterfall",
            title_font_size=14,
            margin=dict(l=40, r=20, t=40, b=30),
            height=300,
            width=700,
            plot_bgcolor="white",
        )
        return fig
    except ImportError:
        return None


# ═══════════════════════════════════════════════════════════════════════════
# PDF BUILDER
# ═══════════════════════════════════════════════════════════════════════════


class _KPIReport(FPDF if FPDF else object):  # type: ignore[misc]
    """Custom FPDF subclass with header/footer for the KPI report."""

    def __init__(self, lang: str = "en"):
        if FPDF is None:
            raise ImportError("fpdf2 is required for PDF generation")
        super().__init__()
        self.lang = lang
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        title = "Reporte Ejecutivo de KPIs" if self.lang == "es" else "Executive KPI Report"
        self.cell(0, 8, title, align="L")
        self.cell(0, 8, datetime.now().strftime("%Y-%m-%d"), align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        page_label = f"Pagina {self.page_no()}/{{nb}}" if self.lang == "es" else f"Page {self.page_no()}/{{nb}}"
        self.cell(0, 10, page_label, align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 30, 30)
        self.ln(6)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(37, 99, 235)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 80, self.get_y())
        self.set_line_width(0.2)
        self.ln(4)

    def body_text(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def kpi_table(self, kpis: List[Dict]):
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(37, 99, 235)
        self.set_text_color(255, 255, 255)

        col_widths = [40, 30, 25, 30, 25, 20, 20]
        headers_en = ["KPI", "Value", "MoM %", "Target", "YoY %", "Status", "Category"]
        headers_es = ["KPI", "Valor", "MoM %", "Meta", "YoY %", "Estado", "Categoria"]
        headers = headers_es if self.lang == "es" else headers_en

        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, h, border=1, fill=True, align="C")
        self.ln()

        self.set_font("Helvetica", "", 8)
        self.set_text_color(50, 50, 50)

        for j, kpi in enumerate(kpis):
            fill = j % 2 == 0
            if fill:
                self.set_fill_color(245, 247, 250)

            status = kpi.get("traffic_light", "green")
            status_colors = {"green": (34, 197, 94), "yellow": (234, 179, 8), "red": (239, 68, 68)}

            row_data = [
                str(kpi.get("name", "")),
                str(kpi.get("formatted", kpi.get("value", ""))),
                f"{kpi.get('change_mom', 0) * 100:+.1f}%",
                str(kpi.get("target", "")),
                f"{kpi.get('change_yoy', 0) * 100:+.1f}%",
                status.upper(),
                str(kpi.get("category", "")),
            ]

            for i, val in enumerate(row_data):
                if i == 5:  # Status column
                    r, g, b = status_colors.get(status, (100, 100, 100))
                    self.set_text_color(r, g, b)
                    self.set_font("Helvetica", "B", 8)
                self.cell(col_widths[i], 6, val, border=1, fill=fill, align="C")
                if i == 5:
                    self.set_text_color(50, 50, 50)
                    self.set_font("Helvetica", "", 8)
            self.ln()


def generate_report(
    data: Dict,
    lang: str = "en",
    sections: Optional[List[str]] = None,
) -> bytes:
    """Generate a multi-section executive KPI report as PDF bytes.

    Args:
        data: Dict with keys: kpis (list), metrics (dict), anomalies (list),
              forecast (dict), waterfall (dict), customer_data (dict).
        lang: 'en' for English, 'es' for Spanish.
        sections: Which sections to include. Default: all sections.

    Returns:
        PDF content as bytes.
    """
    if FPDF is None:
        raise ImportError("fpdf2 is required. Install with: pip install fpdf2")

    all_sections = [
        "cover", "executive_summary", "kpi_dashboard",
        "revenue_analysis", "customer_health", "anomaly_alerts",
        "forecast", "recommendations",
    ]
    active_sections = sections or all_sections

    pdf = _KPIReport(lang=lang)
    pdf.alias_nb_pages()

    temp_files: List[str] = []

    try:
        # ── Cover page ──────────────────────────────────────────────
        if "cover" in active_sections:
            pdf.add_page()
            pdf.ln(50)
            pdf.set_font("Helvetica", "B", 28)
            pdf.set_text_color(37, 99, 235)
            title = "Reporte Ejecutivo de KPIs" if lang == "es" else "Executive KPI Report"
            pdf.cell(0, 15, title, align="C", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(8)
            pdf.set_font("Helvetica", "", 16)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(0, 10, "NovaCRM", align="C", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(4)
            period = data.get("period", {})
            period_str = f"{period.get('start', '')} - {period.get('end', '')}"
            pdf.cell(0, 10, period_str, align="C", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(4)
            pdf.set_font("Helvetica", "I", 11)
            gen_label = "Generado el" if lang == "es" else "Generated on"
            pdf.cell(
                0, 10,
                f"{gen_label} {datetime.now().strftime('%B %d, %Y')}",
                align="C", new_x="LMARGIN", new_y="NEXT",
            )

        # ── Executive Summary ───────────────────────────────────────
        if "executive_summary" in active_sections:
            pdf.add_page()
            sec_title = "Resumen Ejecutivo" if lang == "es" else "Executive Summary"
            pdf.section_title(sec_title)
            metrics = data.get("metrics", {})
            summary = generate_executive_summary(metrics, lang=lang)
            pdf.body_text(summary)

            health = metrics.get("health_score", 0)
            hs_label = "Puntaje de Salud" if lang == "es" else "Health Score"
            pdf.set_font("Helvetica", "B", 12)
            status_color = (34, 197, 94) if health >= 75 else (234, 179, 8) if health >= 50 else (239, 68, 68)
            pdf.set_text_color(*status_color)
            pdf.cell(0, 10, f"{hs_label}: {health:.1f} / 100", new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(50, 50, 50)

        # ── KPI Dashboard Table ─────────────────────────────────────
        if "kpi_dashboard" in active_sections:
            pdf.add_page()
            sec_title = "Tablero de KPIs" if lang == "es" else "KPI Dashboard"
            pdf.section_title(sec_title)
            kpis = data.get("kpis", [])
            if kpis:
                pdf.kpi_table(kpis)

        # ── Revenue Analysis ────────────────────────────────────────
        if "revenue_analysis" in active_sections:
            pdf.add_page()
            sec_title = "Analisis de Ingresos" if lang == "es" else "Revenue Analysis"
            pdf.section_title(sec_title)
            metrics = data.get("metrics", {})
            rev_text = generate_revenue_commentary(metrics, lang=lang)
            pdf.body_text(rev_text)

            # MRR waterfall chart
            waterfall = data.get("waterfall", {})
            if waterfall:
                fig = _create_waterfall_chart(waterfall)
                if fig:
                    path = _render_chart_png(fig)
                    if path:
                        temp_files.append(path)
                        pdf.image(path, x=10, w=190)

        # ── Customer Health ─────────────────────────────────────────
        if "customer_health" in active_sections:
            pdf.add_page()
            sec_title = "Salud del Cliente" if lang == "es" else "Customer Health"
            pdf.section_title(sec_title)
            cust_data = data.get("customer_data", data.get("metrics", {}))
            cust_text = generate_customer_commentary(cust_data, lang=lang)
            pdf.body_text(cust_text)

        # ── Anomaly Alerts ──────────────────────────────────────────
        if "anomaly_alerts" in active_sections:
            anomalies = data.get("anomalies", [])
            if anomalies:
                pdf.add_page()
                sec_title = "Alertas de Anomalias" if lang == "es" else "Anomaly Alerts"
                pdf.section_title(sec_title)
                anom_text = generate_anomaly_narrative(anomalies, lang=lang)
                pdf.body_text(anom_text)

                # Table of anomalies
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_fill_color(239, 68, 68)
                pdf.set_text_color(255, 255, 255)
                anom_headers = (
                    ["Metrica", "Mes", "Valor", "Z-Score", "Severidad"]
                    if lang == "es"
                    else ["Metric", "Month", "Value", "Z-Score", "Severity"]
                )
                col_w = [45, 30, 35, 30, 30]
                for i, h in enumerate(anom_headers):
                    pdf.cell(col_w[i], 7, h, border=1, fill=True, align="C")
                pdf.ln()

                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(50, 50, 50)
                for a in anomalies[:15]:
                    sev = a.get("severity", "info")
                    sev_colors = {"critical": (239, 68, 68), "warning": (234, 179, 8), "info": (100, 100, 100)}
                    row = [
                        str(a.get("metric", "")),
                        str(a.get("month", "")),
                        f"{a.get('value', 0):,.2f}",
                        f"{a.get('zscore', 0):.2f}",
                        sev.upper(),
                    ]
                    for i, val in enumerate(row):
                        if i == 4:
                            r, g, b = sev_colors.get(sev, (100, 100, 100))
                            pdf.set_text_color(r, g, b)
                            pdf.set_font("Helvetica", "B", 8)
                        pdf.cell(col_w[i], 6, val, border=1, align="C")
                        if i == 4:
                            pdf.set_text_color(50, 50, 50)
                            pdf.set_font("Helvetica", "", 8)
                    pdf.ln()

        # ── Forecast ────────────────────────────────────────────────
        if "forecast" in active_sections:
            forecast_data = data.get("forecast", {})
            if forecast_data:
                pdf.add_page()
                sec_title = "Pronostico" if lang == "es" else "Forecast"
                pdf.section_title(sec_title)

                for metric_name, fcast in forecast_data.items():
                    if isinstance(fcast, dict) and "forecast" in fcast:
                        label = metric_name.upper().replace("_", " ")
                        sub_title = f"Pronostico de {label}" if lang == "es" else f"{label} Forecast"
                        pdf.set_font("Helvetica", "B", 11)
                        pdf.cell(0, 8, sub_title, new_x="LMARGIN", new_y="NEXT")
                        pdf.set_font("Helvetica", "", 9)

                        vals = fcast["forecast"]
                        ci_lo = fcast.get("ci_lower", [])
                        ci_hi = fcast.get("ci_upper", [])

                        for i, v in enumerate(vals):
                            lo = ci_lo[i] if i < len(ci_lo) else "N/A"
                            hi = ci_hi[i] if i < len(ci_hi) else "N/A"
                            line = f"  Period +{i + 1}: {v:,.2f}  (CI: {lo:,.2f} - {hi:,.2f})"
                            pdf.cell(0, 5, line, new_x="LMARGIN", new_y="NEXT")
                        pdf.ln(4)

        # ── Recommendations ─────────────────────────────────────────
        if "recommendations" in active_sections:
            pdf.add_page()
            sec_title = "Recomendaciones" if lang == "es" else "Recommendations"
            pdf.section_title(sec_title)

            metrics = data.get("metrics", {})
            recs = _generate_recommendations(metrics, lang=lang)
            for i, rec in enumerate(recs, 1):
                pdf.set_font("Helvetica", "B", 10)
                pdf.cell(0, 7, f"{i}. {rec['title']}", new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("Helvetica", "", 9)
                pdf.multi_cell(0, 5, f"   {rec['body']}")
                pdf.ln(2)

        # Output
        return bytes(pdf.output())

    finally:
        # Clean up temp chart files
        for f in temp_files:
            try:
                os.unlink(f)
            except OSError:
                pass


def _generate_recommendations(metrics: Dict, lang: str = "en") -> List[Dict]:
    """Generate data-driven recommendations based on KPI values."""
    recs = []
    churn = metrics.get("logo_churn_rate", 0)
    nps = metrics.get("nps", 50)
    nrr = metrics.get("nrr", metrics.get("net_revenue_retention", 1.0))
    ltv_cac = metrics.get("ltv_cac_ratio", 3.0)
    mrr_growth = metrics.get("mrr_growth_rate", 0)

    if lang == "es":
        if churn > 0.03:
            recs.append({
                "title": "Reducir tasa de abandono",
                "body": (
                    f"Con una tasa de abandono de {churn * 100:.1f}%, se recomienda implementar "
                    "un programa de retencion proactiva con alertas tempranas basadas en uso del producto."
                ),
            })
        if nps < 40:
            recs.append({
                "title": "Mejorar satisfaccion del cliente",
                "body": (
                    f"El NPS de {nps:.0f} sugiere oportunidades de mejora. Considerar encuestas "
                    "de seguimiento y un programa de customer success mas activo."
                ),
            })
        if nrr < 1.0:
            recs.append({
                "title": "Impulsar retencion neta de ingresos",
                "body": (
                    f"La NRR de {nrr * 100:.0f}% esta por debajo del 100%. Enfocarse en "
                    "upselling y cross-selling para compensar contracciones y abandonos."
                ),
            })
        if ltv_cac < 3.0:
            recs.append({
                "title": "Optimizar eficiencia de adquisicion",
                "body": (
                    f"La relacion LTV:CAC de {ltv_cac:.1f}x esta por debajo del benchmark de 3x. "
                    "Evaluar canales de adquisicion y considerar estrategias de menor costo."
                ),
            })
        if mrr_growth < 0.02:
            recs.append({
                "title": "Acelerar crecimiento de MRR",
                "body": (
                    f"El crecimiento de MRR de {mrr_growth * 100:.1f}% es bajo. Considerar "
                    "nuevas estrategias de pricing, expansion de producto o penetracion de mercado."
                ),
            })
        if not recs:
            recs.append({
                "title": "Mantener el impulso actual",
                "body": "Las metricas se encuentran en niveles saludables. Continuar monitoreando y optimizando.",
            })
    else:
        if churn > 0.03:
            recs.append({
                "title": "Reduce churn rate",
                "body": (
                    f"At {churn * 100:.1f}% logo churn, implement a proactive retention program "
                    "with early-warning alerts based on product usage patterns."
                ),
            })
        if nps < 40:
            recs.append({
                "title": "Improve customer satisfaction",
                "body": (
                    f"NPS of {nps:.0f} indicates room for improvement. Consider follow-up surveys "
                    "and a more proactive customer success program."
                ),
            })
        if nrr < 1.0:
            recs.append({
                "title": "Boost net revenue retention",
                "body": (
                    f"NRR at {nrr * 100:.0f}% is below 100%. Focus on upselling and cross-selling "
                    "to offset contraction and churn revenue."
                ),
            })
        if ltv_cac < 3.0:
            recs.append({
                "title": "Optimize acquisition efficiency",
                "body": (
                    f"LTV:CAC ratio of {ltv_cac:.1f}x is below the 3x benchmark. "
                    "Evaluate acquisition channels and consider lower-cost strategies."
                ),
            })
        if mrr_growth < 0.02:
            recs.append({
                "title": "Accelerate MRR growth",
                "body": (
                    f"MRR growth of {mrr_growth * 100:.1f}% is sluggish. Consider new pricing "
                    "strategies, product expansion, or market penetration initiatives."
                ),
            })
        if not recs:
            recs.append({
                "title": "Maintain current momentum",
                "body": "Metrics are at healthy levels. Continue monitoring and optimizing.",
            })

    return recs
