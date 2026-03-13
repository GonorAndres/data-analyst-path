"""Template-based bilingual (EN/ES) natural language generation for KPI reports.

All functions accept a ``lang`` parameter ('en' or 'es') and return human-readable
narrative strings built from structured data using f-string templates with
conditional logic.
"""

from typing import Dict, List


# ═══════════════════════════════════════════════════════════════════════════
# EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════════════════════════


def generate_executive_summary(metrics: Dict, lang: str = "en") -> str:
    """Generate a 3-5 sentence executive summary from monthly KPI metrics.

    Args:
        metrics: Dict with keys like mrr, nrr, nps, logo_churn_rate,
                 mrr_growth_rate, health_score, etc.
        lang: 'en' for English, 'es' for Spanish.

    Returns:
        Multi-sentence narrative string.
    """
    health = metrics.get("health_score", 0)
    mrr = metrics.get("mrr", 0)
    mrr_growth = metrics.get("mrr_growth_rate", 0)
    nrr = metrics.get("nrr", metrics.get("net_revenue_retention", 0))
    churn = metrics.get("logo_churn_rate", 0)
    nps = metrics.get("nps", 0)

    mrr_fmt = _fmt_currency(mrr)
    mrr_g_pct = _fmt_pct(mrr_growth)
    nrr_pct = _fmt_pct(nrr) if nrr <= 2 else f"{nrr:.0f}%"
    churn_pct = _fmt_pct(churn)

    # Determine overall tone
    if health >= 75:
        tone_en = "strong"
        tone_es = "solida"
    elif health >= 50:
        tone_en = "moderate"
        tone_es = "moderada"
    else:
        tone_en = "concerning"
        tone_es = "preocupante"

    # MRR direction
    if mrr_growth > 0.02:
        mrr_dir_en = f"MRR grew {mrr_g_pct} month-over-month to {mrr_fmt}, signaling healthy top-line momentum."
        mrr_dir_es = f"El MRR crecio {mrr_g_pct} mes a mes hasta {mrr_fmt}, indicando un impulso positivo en ingresos."
    elif mrr_growth >= 0:
        mrr_dir_en = f"MRR reached {mrr_fmt} with {mrr_g_pct} growth, indicating a stable but slowing trajectory."
        mrr_dir_es = f"El MRR alcanzo {mrr_fmt} con crecimiento de {mrr_g_pct}, indicando estabilidad pero desaceleracion."
    else:
        mrr_dir_en = f"MRR declined {mrr_g_pct} to {mrr_fmt}, requiring immediate attention."
        mrr_dir_es = f"El MRR disminuyo {mrr_g_pct} a {mrr_fmt}, lo cual requiere atencion inmediata."

    # Churn commentary
    if churn < 0.02:
        churn_en = f"Logo churn remains well-controlled at {churn_pct}."
        churn_es = f"La tasa de abandono se mantiene controlada en {churn_pct}."
    elif churn < 0.05:
        churn_en = f"Logo churn at {churn_pct} is within acceptable range but warrants monitoring."
        churn_es = f"La tasa de abandono de {churn_pct} esta dentro del rango aceptable pero requiere seguimiento."
    else:
        churn_en = f"Logo churn has risen to {churn_pct}, flagging potential retention issues."
        churn_es = f"La tasa de abandono subio a {churn_pct}, senalando posibles problemas de retencion."

    # NPS
    if nps >= 50:
        nps_en = f"NPS of {nps:.0f} reflects strong customer satisfaction."
        nps_es = f"El NPS de {nps:.0f} refleja una alta satisfaccion del cliente."
    elif nps >= 20:
        nps_en = f"NPS stands at {nps:.0f}, indicating room for customer experience improvements."
        nps_es = f"El NPS se ubica en {nps:.0f}, indicando oportunidades de mejora en experiencia del cliente."
    else:
        nps_en = f"NPS of {nps:.0f} is below industry benchmarks and demands action."
        nps_es = f"El NPS de {nps:.0f} esta por debajo de los benchmarks del sector y requiere accion."

    if lang == "es":
        return (
            f"La salud general de NovaCRM se evalua como {tone_es} "
            f"con un puntaje de {health:.1f}/100. "
            f"{mrr_dir_es} "
            f"{churn_es} "
            f"{nps_es}"
        )

    return (
        f"NovaCRM's overall health score stands at {health:.1f}/100, "
        f"reflecting a {tone_en} position. "
        f"{mrr_dir_en} "
        f"{churn_en} "
        f"{nps_en}"
    )


# ═══════════════════════════════════════════════════════════════════════════
# ANOMALY NARRATIVE
# ═══════════════════════════════════════════════════════════════════════════


def generate_anomaly_narrative(anomalies: List[Dict], lang: str = "en") -> str:
    """Generate a narrative explaining flagged anomalies.

    Args:
        anomalies: List of dicts with metric, month, value, zscore, severity.
        lang: 'en' or 'es'.

    Returns:
        Human-readable anomaly summary.
    """
    if not anomalies:
        if lang == "es":
            return "No se detectaron anomalias significativas en el periodo analizado."
        return "No significant anomalies were detected in the analyzed period."

    critical = [a for a in anomalies if a.get("severity") == "critical"]
    warnings = [a for a in anomalies if a.get("severity") == "warning"]

    parts = []

    if lang == "es":
        if critical:
            metrics_str = ", ".join(
                f"{a.get('metric', 'N/A')} en {a.get('month', '?')}" for a in critical[:3]
            )
            parts.append(
                f"Se detectaron {len(critical)} anomalia(s) critica(s): {metrics_str}. "
                f"Estos valores superan 3 desviaciones estandar del promedio historico."
            )
        if warnings:
            parts.append(
                f"Adicionalmente, {len(warnings)} metrica(s) presentan desviaciones de advertencia "
                f"que merecen seguimiento."
            )
        if not parts:
            parts.append("Se identificaron anomalias menores que no requieren accion inmediata.")
    else:
        if critical:
            metrics_str = ", ".join(
                f"{a.get('metric', 'N/A')} in {a.get('month', '?')}" for a in critical[:3]
            )
            parts.append(
                f"{len(critical)} critical anomaly(ies) detected: {metrics_str}. "
                f"These values exceed 3 standard deviations from the historical mean."
            )
        if warnings:
            parts.append(
                f"Additionally, {len(warnings)} metric(s) show warning-level deviations "
                f"that merit close monitoring."
            )
        if not parts:
            parts.append("Minor anomalies were identified that do not require immediate action.")

    return " ".join(parts)


# ═══════════════════════════════════════════════════════════════════════════
# REVENUE COMMENTARY
# ═══════════════════════════════════════════════════════════════════════════


def generate_revenue_commentary(data: Dict, lang: str = "en") -> str:
    """Generate revenue-focused insights.

    Args:
        data: Dict with mrr, arr, nrr, mrr_growth_rate, waterfall components.
        lang: 'en' or 'es'.

    Returns:
        Revenue narrative string.
    """
    mrr = data.get("mrr", 0)
    arr = data.get("arr", mrr * 12)
    nrr = data.get("nrr", data.get("net_revenue_retention", 0))
    expansion = data.get("expansion_mrr", 0)
    contraction = data.get("contraction_mrr", 0)
    churned = data.get("churned_mrr", 0)

    mrr_fmt = _fmt_currency(mrr)
    arr_fmt = _fmt_currency(arr)
    nrr_pct = _fmt_pct(nrr) if nrr <= 2 else f"{nrr:.0f}%"

    net_expansion = expansion - contraction - churned
    net_dir = "positive" if net_expansion > 0 else "negative"
    net_dir_es = "positiva" if net_expansion > 0 else "negativa"

    if lang == "es":
        return (
            f"Los ingresos recurrentes mensuales (MRR) se ubican en {mrr_fmt}, "
            f"con un ARR equivalente de {arr_fmt}. "
            f"La retencion neta de ingresos (NRR) es de {nrr_pct}, "
            f"{'superando' if nrr > 1 else 'por debajo de'} el umbral de 100%. "
            f"La dinamica de expansion neta es {net_dir_es}: "
            f"expansiones de {_fmt_currency(expansion)} vs. contracciones de "
            f"{_fmt_currency(contraction)} y abandonos de {_fmt_currency(churned)}."
        )

    return (
        f"Monthly Recurring Revenue (MRR) stands at {mrr_fmt}, "
        f"translating to an ARR of {arr_fmt}. "
        f"Net Revenue Retention (NRR) is {nrr_pct}, "
        f"{'exceeding' if nrr > 1 else 'falling below'} the 100% benchmark. "
        f"Net expansion dynamics are {net_dir}: "
        f"${expansion:,.0f} in expansions vs. ${contraction:,.0f} in contractions "
        f"and ${churned:,.0f} in churn."
    )


# ═══════════════════════════════════════════════════════════════════════════
# CUSTOMER COMMENTARY
# ═══════════════════════════════════════════════════════════════════════════


def generate_customer_commentary(data: Dict, lang: str = "en") -> str:
    """Generate customer health insights.

    Args:
        data: Dict with nps, logo_churn_rate, revenue_churn_rate,
              active_customers, support_tickets, etc.
        lang: 'en' or 'es'.

    Returns:
        Customer health narrative string.
    """
    nps = data.get("nps", 0)
    logo_churn = data.get("logo_churn_rate", 0)
    rev_churn = data.get("revenue_churn_rate", 0)
    active = data.get("active_customers", data.get("total_customers", 0))
    tickets = data.get("support_tickets", 0)

    churn_gap = rev_churn - logo_churn
    churn_gap_note = ""
    churn_gap_note_es = ""

    if churn_gap > 0.01:
        churn_gap_note = (
            " Revenue churn exceeding logo churn suggests larger accounts "
            "are leaving at a higher rate -- a critical signal."
        )
        churn_gap_note_es = (
            " El abandono de ingresos superior al de logos sugiere que las cuentas "
            "mas grandes estan saliendo a mayor velocidad -- una senal critica."
        )

    if lang == "es":
        return (
            f"La base activa es de {active:,.0f} clientes con un NPS de {nps:.0f}. "
            f"La tasa de abandono de logos es {_fmt_pct(logo_churn)} y la de ingresos "
            f"{_fmt_pct(rev_churn)}.{churn_gap_note_es}"
            f"{f' Se registraron {tickets:,.0f} tickets de soporte en el periodo.' if tickets else ''}"
        )

    return (
        f"The active customer base stands at {active:,.0f} with an NPS of {nps:.0f}. "
        f"Logo churn rate is {_fmt_pct(logo_churn)} while revenue churn is "
        f"{_fmt_pct(rev_churn)}.{churn_gap_note}"
        f"{f' {tickets:,.0f} support tickets were logged in the period.' if tickets else ''}"
    )


# ═══════════════════════════════════════════════════════════════════════════
# HELPER FORMATTERS
# ═══════════════════════════════════════════════════════════════════════════


def _fmt_currency(value: float) -> str:
    """Format a number as a compact USD string."""
    abs_val = abs(value)
    sign = "-" if value < 0 else ""
    if abs_val >= 1_000_000:
        return f"{sign}${abs_val / 1_000_000:,.1f}M"
    elif abs_val >= 1_000:
        return f"{sign}${abs_val / 1_000:,.0f}K"
    return f"{sign}${abs_val:,.0f}"


def _fmt_pct(value: float) -> str:
    """Format a decimal ratio as a percentage string.

    Values <= 1 are treated as ratios (e.g. 0.032 -> '3.2%').
    Values > 1 are treated as already-percentage (e.g. 45 -> '45.0%').
    """
    if abs(value) <= 1:
        return f"{value * 100:.1f}%"
    return f"{value:.1f}%"
