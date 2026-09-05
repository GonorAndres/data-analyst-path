"""Regression tests for the evidence behind anomaly comparisons."""

import pandas as pd
import pytest

from kpi_backend.analytics_engine import (
    detect_anomalies_iqr,
    detect_anomalies_zscore,
    scan_anomalies,
)


@pytest.mark.parametrize("values", [[], [5], [5, 5, 5, 5]])
def test_empty_and_constant_series_have_no_anomalies(values):
    series = pd.Series(values, dtype=float)
    assert detect_anomalies_zscore(series) == []
    assert detect_anomalies_iqr(series) == []


def test_zscore_reports_actual_mean_and_sample_sd_bounds():
    series = pd.Series([9, 10, 11, 9, 10, 11, 9, 10, 11, 100])
    [anomaly] = detect_anomalies_zscore(series)
    assert anomaly["expected"] == pytest.approx(19)
    assert anomaly["lower_bound"] == pytest.approx(19 - 2 * series.std())
    assert anomaly["upper_bound"] == pytest.approx(19 + 2 * series.std())
    assert anomaly["zscore"] == pytest.approx((100 - 19) / series.std(), abs=0.0001)


def test_iqr_reports_median_and_tukey_fences():
    series = pd.Series([9, 10, 11, 9, 10, 11, 9, 10, 11, 100])
    [anomaly] = detect_anomalies_iqr(series)
    assert anomaly["expected"] == 10
    assert anomaly["lower_bound"] == 6.625
    assert anomaly["upper_bound"] == 13.625


def test_iqr_zero_spread_still_flags_departure_from_constant_baseline():
    [anomaly] = detect_anomalies_iqr(pd.Series([10] * 9 + [100]))
    assert anomaly["value"] == 100
    assert anomaly["lower_bound"] == anomaly["upper_bound"] == 10


def test_dedup_preserves_both_baselines_and_unique_count():
    source = pd.DataFrame({"month": [f"2025-{m:02d}" for m in range(1, 11)],
                           "mrr": [9, 10, 11, 9, 10, 11, 9, 10, 11, 100]})
    [anomaly] = scan_anomalies(source)
    assert anomaly["method"] == "both"
    assert anomaly["expected"] == 19
    assert {e["method"]: e["expected"] for e in anomaly["evidence"]} == {"zscore": 19, "iqr": 10}
    assert anomaly["month"] == "2025-10"
    [iqr_only] = scan_anomalies(source, method="iqr")
    assert iqr_only["method"] == "iqr"
    assert iqr_only["expected"] == 10
    assert len(iqr_only["evidence"]) == 1


def test_endpoint_returns_reproducible_baseline(monkeypatch):
    from kpi_backend.routers import anomalies as module

    frame = pd.DataFrame({"month": pd.date_range("2025-01-01", periods=10, freq="MS"),
                          "mrr": [9, 10, 11, 9, 10, 11, 9, 10, 11, 100]})
    monkeypatch.setattr(module.data_loader, "monthly_kpis", frame)
    result = module.anomalies(None, None, None, "both", 2.0, "en")
    assert result["summary"]["total"] == 1
    assert result["anomalies"][0]["expected"] == 19
    assert result["anomalies"][0]["method"] == "both"


def test_percentage_units_do_not_change_above_one():
    from kpi_backend.commentary import _fmt_pct
    from kpi_backend.routers.overview import _fmt_value

    assert _fmt_pct(1.12348) == "112.3%"
    assert _fmt_value(1.12348, "pct") == "112.3%"
    assert _fmt_pct(0.015) == "1.5%"


def test_summary_uses_actual_pipeline_growth_column():
    from kpi_backend.commentary import generate_executive_summary

    assert "1.8%" in generate_executive_summary({"mom_change_mrr": 0.018})


def test_mrr_waterfall_reconciles_to_reported_ending_revenue():
    from kpi_backend.analytics_engine import mrr_waterfall

    result = mrr_waterfall({"mrr": 1100, "new_mrr": 80, "expansion_mrr": 50,
                            "contraction_mrr": 10, "churned_mrr": 20})
    assert result["starting_mrr"] == 1000
    assert result["ending_mrr"] == 1100


def test_report_and_api_use_same_filtered_anomaly_evidence(monkeypatch):
    from kpi_backend.routers import anomalies as api
    from kpi_backend.routers import report

    frame = pd.DataFrame({"month": pd.date_range("2025-01-01", periods=10, freq="MS"),
                          "gross_margin": [0.70, 0.71, 0.72] * 3 + [0.99]})
    monkeypatch.setattr(api.data_loader, "monthly_kpis", frame)
    captured = {}

    def capture_report(data, **kwargs):
        captured.update(data)
        return b"%PDF-test"

    monkeypatch.setattr(report, "generate_report", capture_report)
    api_result = api.anomalies(None, "2025-02", "2025-10", "both", 2.0, "en")
    report.generate_pdf_report(None, "2025-02", "2025-10", "en", None)
    assert len(captured["anomalies"]) == api_result["summary"]["total"] == 1
    assert captured["anomalies"][0]["evidence"] == api_result["anomalies"][0]["evidence"]
