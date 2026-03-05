from typing import Optional

import pandas as pd


def apply_filters(
    df: pd.DataFrame,
    lob: Optional[str] = None,
    company: Optional[int] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
) -> pd.DataFrame:
    """Apply common filters across insurance datasets.

    Args:
        df: Source DataFrame.
        lob: Line of business name (exact match).
        company: GRCODE integer (triangles data only).
        year_start: Minimum accident year (inclusive).
        year_end: Maximum accident year (inclusive).
    """
    filtered = df.copy()

    if lob:
        if "line_of_business" in filtered.columns:
            filtered = filtered[filtered["line_of_business"] == lob]

    if company is not None:
        if "GRCODE" in filtered.columns:
            filtered = filtered[filtered["GRCODE"] == company]

    if year_start is not None:
        if "AccidentYear" in filtered.columns:
            filtered = filtered[filtered["AccidentYear"] >= year_start]
        elif "accident_year" in filtered.columns:
            filtered = filtered[filtered["accident_year"] >= year_start]

    if year_end is not None:
        if "AccidentYear" in filtered.columns:
            filtered = filtered[filtered["AccidentYear"] <= year_end]
        elif "accident_year" in filtered.columns:
            filtered = filtered[filtered["accident_year"] <= year_end]

    return filtered
