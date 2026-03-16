"""Core analytics engine for NYC 311 Operational Efficiency analysis.

All functions are pure (no side effects, no global state). Each receives a
filtered DataFrame and returns a JSON-serialisable dict or list.
Floats are rounded to 4 decimal places.

Column reference (from 03_enrich.py):
  sla_status:         "Cumple" | "Incumple" | "Sin SLA"
  resolution_days:    float (null if not closed)
  is_overdue:         bool or null
  response_category:  "< 1 dia" | "1-3 dias" | "3-7 dias" | "7-30 dias" | "> 30 dias" | null
  created_month:      "YYYY-MM"
  created_dow:        "Lunes" | "Martes" | ... | "Domingo"  (Spanish)
  created_hour:       int 0-23
  complaint_category: top 20 complaint types or "Otros"
  process_stage:      "Abierto" | "En Progreso" | "Cerrado" | "Pendiente" | "Otro"
"""

import math
from typing import Dict, List

import pandas as pd


def _safe(val: object) -> object:
    """Convert NaN/inf to None for JSON serialization."""
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    return val


def _sla_rate(group: pd.DataFrame) -> float | None:
    """Compute SLA compliance rate for a group, excluding 'Sin SLA' rows."""
    if "sla_status" not in group.columns:
        return None
    with_sla = group[group["sla_status"] != "Sin SLA"]
    if len(with_sla) == 0:
        return None
    return round(float((with_sla["sla_status"] == "Cumple").mean()), 4)


# ═══════════════════════════════════════════════════════════════════════════
# OVERVIEW
# ═══════════════════════════════════════════════════════════════════════════


def compute_overview(df: pd.DataFrame) -> dict:
    """KPI summary for the overview page."""
    total = len(df)

    # Resolution days
    res = df["resolution_days"].dropna() if "resolution_days" in df.columns else pd.Series(dtype=float)
    avg_res = round(float(res.mean()), 4) if len(res) > 0 else None
    med_res = round(float(res.median()), 4) if len(res) > 0 else None

    # SLA compliance
    sla_rate = _sla_rate(df)

    # Open / Closed percentages
    if "status" in df.columns:
        status_lower = df["status"].str.lower()
        pct_open = round(float((status_lower == "open").mean()), 4)
        pct_closed = round(float((status_lower == "closed").mean()), 4)
    else:
        pct_open = None
        pct_closed = None

    # Close rate as percentage
    close_rate = round(pct_closed * 100, 1) if pct_closed is not None else None

    # Primary channel
    primary_channel = None
    if "open_data_channel_type" in df.columns and not df.empty:
        primary_channel = str(df["open_data_channel_type"].value_counts().index[0])

    # Open requests count
    open_requests = None
    if "status" in df.columns:
        open_requests = int((df["status"].str.lower() == "open").sum())

    # Top 10 complaint types
    top_complaints: List[dict] = []
    if "complaint_category" in df.columns:
        vc = df["complaint_category"].value_counts().head(10)
        for cat, cnt in vc.items():
            top_complaints.append({
                "complaint_type": str(cat),
                "count": int(cnt),
                "pct": round(float(cnt / total * 100), 1) if total > 0 else 0.0,
            })

    # Requests by borough
    by_borough: Dict[str, int] = {}
    if "borough" in df.columns:
        for boro, cnt in df["borough"].value_counts().items():
            by_borough[str(boro)] = int(cnt)

    # Requests by channel
    by_channel: Dict[str, int] = {}
    if "open_data_channel_type" in df.columns:
        for ch, cnt in df["open_data_channel_type"].value_counts().items():
            by_channel[str(ch)] = int(cnt)

    return {
        "total_requests": total,
        "avg_resolution_days": avg_res,
        "median_resolution_days": med_res,
        "sla_compliance_rate": round(sla_rate * 100, 1) if sla_rate is not None else None,
        "pct_open": pct_open,
        "pct_closed": pct_closed,
        "close_rate": close_rate,
        "primary_channel": primary_channel,
        "open_requests": open_requests,
        "top_complaint_types": top_complaints,
        "requests_by_borough": by_borough,
        "requests_by_channel": by_channel,
    }


def sla_verdict(compliance_rate: float) -> str:
    """Return a verdict label string for the SLA compliance rate.

    Args:
        compliance_rate: Percentage (0-100) of requests meeting SLA.
    """
    if compliance_rate >= 85:
        return "CUMPLE"
    elif compliance_rate >= 70:
        return "EN RIESGO"
    else:
        return "INCUMPLE"


# ═══════════════════════════════════════════════════════════════════════════
# BOTTLENECK / SANKEY
# ═══════════════════════════════════════════════════════════════════════════


def build_sankey_data(df: pd.DataFrame) -> dict:
    """Build Sankey flow: complaint_category -> agency_name -> process_stage -> response_category."""
    required_cols = {"complaint_category", "agency_name", "process_stage", "response_category"}
    if not required_cols.issubset(set(df.columns)):
        return {"nodes": [], "links": []}

    work = df.copy()
    # Coerce response_category: drop nulls and string "None"/"0" artifacts from np.select
    if "response_category" in work.columns:
        work["response_category"] = work["response_category"].replace({"None": None, "0": None, "": None})
    work = work.dropna(subset=["response_category"])
    if work.empty:
        return {"nodes": [], "links": []}

    top_complaints = work["complaint_category"].value_counts().head(10).index.tolist()
    top_agencies = work["agency_name"].value_counts().head(10).index.tolist()
    work = work[
        work["complaint_category"].isin(top_complaints)
        & work["agency_name"].isin(top_agencies)
    ]
    if work.empty:
        return {"nodes": [], "links": []}

    node_names: list = []
    node_index: dict = {}

    def _get_or_add(name: str, prefix: str) -> int:
        key = f"{prefix}::{name}"
        if key not in node_index:
            node_index[key] = len(node_names)
            node_names.append({"id": len(node_names), "name": name})
        return node_index[key]

    links: list = []

    # Layer 1: complaint_category -> agency_name
    g1 = work.groupby(["complaint_category", "agency_name"]).size().reset_index(name="value")
    for _, row in g1.iterrows():
        src = _get_or_add(str(row["complaint_category"]), "complaint")
        tgt = _get_or_add(str(row["agency_name"]), "agency")
        links.append({"source": src, "target": tgt, "value": int(row["value"])})

    # Layer 2: agency_name -> process_stage
    g2 = work.groupby(["agency_name", "process_stage"]).size().reset_index(name="value")
    for _, row in g2.iterrows():
        src = _get_or_add(str(row["agency_name"]), "agency")
        tgt = _get_or_add(str(row["process_stage"]), "stage")
        links.append({"source": src, "target": tgt, "value": int(row["value"])})

    # Layer 3: process_stage -> response_category
    g3 = work.groupby(["process_stage", "response_category"]).size().reset_index(name="value")
    for _, row in g3.iterrows():
        src = _get_or_add(str(row["process_stage"]), "stage")
        tgt = _get_or_add(str(row["response_category"]), "response")
        links.append({"source": src, "target": tgt, "value": int(row["value"])})

    return {"nodes": node_names, "links": links}


def detect_bottlenecks(df: pd.DataFrame) -> list:
    """Find top 10 agency + complaint_type combos with highest avg resolution_days."""
    if df.empty:
        return []

    required = {"agency_name", "complaint_category", "resolution_days"}
    if not required.issubset(set(df.columns)):
        return []

    work = df.dropna(subset=["resolution_days"])
    if work.empty:
        return []

    agg = (
        work.groupby(["agency_name", "complaint_category"])["resolution_days"]
        .agg(["mean", "median", "count"])
        .reset_index()
    )
    agg.columns = ["agency_name", "complaint_category", "avg_days", "median_days", "count"]

    # Add SLA compliance per group
    if "sla_status" in work.columns:
        sla_data = []
        for (agency, complaint), group in work.groupby(["agency_name", "complaint_category"]):
            sla_data.append({
                "agency_name": agency,
                "complaint_category": complaint,
                "sla_compliance": _sla_rate(group),
            })
        sla_df = pd.DataFrame(sla_data)
        agg = agg.merge(sla_df, on=["agency_name", "complaint_category"], how="left")
    else:
        agg["sla_compliance"] = None

    agg = agg.sort_values("avg_days", ascending=False).head(10)

    results = []
    for _, row in agg.iterrows():
        results.append({
            "agency": str(row["agency_name"]),
            "complaint_type": str(row["complaint_category"]),
            "avg_days": _safe(round(float(row["avg_days"]), 4)),
            "median_days": _safe(round(float(row["median_days"]), 4)),
            "count": int(row["count"]),
            "sla_compliance": _safe(row["sla_compliance"]),
        })

    return results


# ═══════════════════════════════════════════════════════════════════════════
# DEPARTMENTS
# ═══════════════════════════════════════════════════════════════════════════


def agency_ranking(df: pd.DataFrame) -> list:
    """Rank agencies by volume."""
    if df.empty or "agency_name" not in df.columns:
        return []

    results = []
    for agency, group in df.groupby("agency_name"):
        count = len(group)
        res = group["resolution_days"].dropna() if "resolution_days" in group.columns else pd.Series(dtype=float)

        results.append({
            "agency": str(agency),
            "total_requests": count,
            "avg_resolution_days": _safe(round(float(res.mean()), 4)) if len(res) > 0 else None,
            "median_resolution_days": _safe(round(float(res.median()), 4)) if len(res) > 0 else None,
            "sla_compliance": _safe(_sla_rate(group)),
            "pct_overdue": _safe(
                round(float(group["is_overdue"].dropna().astype(bool).mean()), 4)
                if "is_overdue" in group.columns and group["is_overdue"].dropna().shape[0] > 0
                else None
            ),
        })

    results.sort(key=lambda x: x["total_requests"], reverse=True)
    return results


def agency_complaint_heatmap(df: pd.DataFrame) -> dict:
    """Top 10 agencies x top 10 complaint types count matrix.

    Uses the raw complaint_type column (not the bucketed complaint_category)
    so each cell reflects a specific complaint type rather than the catch-all
    'Otros' bucket that dominates most agencies.
    """
    if df.empty:
        return {"agencies": [], "complaint_types": [], "matrix": []}

    col = "complaint_type" if "complaint_type" in df.columns else "complaint_category"
    required = {"agency_name", col}
    if not required.issubset(set(df.columns)):
        return {"agencies": [], "complaint_types": [], "matrix": []}

    top_agencies = df["agency_name"].value_counts().head(10).index.tolist()
    top_complaints = df[col].value_counts().head(15).index.tolist()

    subset = df[
        df["agency_name"].isin(top_agencies)
        & df[col].isin(top_complaints)
    ]

    pivot = subset.pivot_table(
        index="agency_name",
        columns=col,
        aggfunc="size",
        fill_value=0,
    )

    pivot = pivot.reindex(index=top_agencies, columns=top_complaints, fill_value=0)

    # Drop agencies whose row is entirely zero (no overlap with top complaints)
    pivot = pivot.loc[pivot.sum(axis=1) > 0]

    return {
        "agencies": [str(a) for a in pivot.index.tolist()],
        "complaint_types": [str(c) for c in pivot.columns.tolist()],
        "matrix": pivot.values.astype(int).tolist(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# GEOGRAPHIC
# ═══════════════════════════════════════════════════════════════════════════


def borough_summary(df: pd.DataFrame) -> list:
    """Per-borough statistics."""
    if df.empty or "borough" not in df.columns:
        return []

    total = len(df)
    results = []

    for borough, group in df.groupby("borough"):
        count = len(group)
        res = group["resolution_days"].dropna() if "resolution_days" in group.columns else pd.Series(dtype=float)

        top_complaint = None
        if "complaint_category" in group.columns and not group["complaint_category"].empty:
            top_complaint = str(group["complaint_category"].value_counts().index[0])

        results.append({
            "borough": str(borough),
            "total_requests": count,
            "avg_resolution_days": _safe(round(float(res.mean()), 4)) if len(res) > 0 else None,
            "sla_compliance": _safe(_sla_rate(group)),
            "top_complaint": top_complaint,
            "pct_of_total": round(float(count / total), 4) if total > 0 else 0.0,
        })

    results.sort(key=lambda x: x["total_requests"], reverse=True)
    return results


# ═══════════════════════════════════════════════════════════════════════════
# TRENDS
# ═══════════════════════════════════════════════════════════════════════════


def monthly_time_series(df: pd.DataFrame) -> list:
    """Monthly aggregation of requests."""
    if df.empty or "created_month" not in df.columns:
        return []

    results = []
    for month in sorted(df["created_month"].dropna().unique()):
        group = df[df["created_month"] == month]
        res = group["resolution_days"].dropna() if "resolution_days" in group.columns else pd.Series(dtype=float)

        results.append({
            "month": str(month),
            "total_requests": len(group),
            "avg_resolution_days": _safe(round(float(res.mean()), 4)) if len(res) > 0 else None,
            "sla_compliance": _safe(_sla_rate(group)),
        })

    return results


def dow_hour_heatmap(df: pd.DataFrame) -> dict:
    """Day-of-week x hour-of-day request count matrix.

    created_dow is already in Spanish: Lunes, Martes, ..., Domingo.
    """
    if df.empty:
        return {"days": [], "hours": [], "matrix": []}

    required = {"created_dow", "created_hour"}
    if not required.issubset(set(df.columns)):
        return {"days": [], "hours": [], "matrix": []}

    day_order = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]
    hours = list(range(24))

    pivot = df.pivot_table(
        index="created_dow",
        columns="created_hour",
        aggfunc="size",
        fill_value=0,
    )

    pivot = pivot.reindex(index=day_order, columns=hours, fill_value=0)

    return {
        "days": day_order,
        "hours": hours,
        "matrix": pivot.values.astype(int).tolist(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# PARETO / PRIORITY
# ═══════════════════════════════════════════════════════════════════════════


def pareto_analysis(df: pd.DataFrame) -> dict:
    """Pareto analysis for complaint types."""
    if df.empty or "complaint_category" not in df.columns:
        return {"items": []}

    total = len(df)
    vc = df["complaint_category"].value_counts()

    items = []
    cum_pct = 0.0
    for cat, cnt in vc.items():
        pct = float(cnt) / total if total > 0 else 0.0
        cum_pct += pct
        items.append({
            "complaint_type": str(cat),
            "count": int(cnt),
            "pct": round(pct * 100, 1),
            "cumulative_pct": round(cum_pct * 100, 1),
        })

    return {"items": items}


def priority_matrix(df: pd.DataFrame) -> list:
    """Scatter data: each complaint_type (volume vs resolution time)."""
    if df.empty or "complaint_category" not in df.columns:
        return []

    results = []
    for cat, group in df.groupby("complaint_category"):
        count = len(group)
        if count <= 100:
            continue

        res = group["resolution_days"].dropna() if "resolution_days" in group.columns else pd.Series(dtype=float)

        results.append({
            "complaint_type": str(cat),
            "volume": count,
            "avg_resolution_days": _safe(round(float(res.mean()), 4)) if len(res) > 0 else None,
            "sla_compliance": _safe(_sla_rate(group)),
        })

    results.sort(key=lambda x: x["volume"], reverse=True)
    return results
