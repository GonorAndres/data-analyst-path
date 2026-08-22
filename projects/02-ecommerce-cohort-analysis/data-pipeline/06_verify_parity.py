"""Prove the static JSON says what the Streamlit app said.

The /cohorts dashboard replaced a Streamlit app that queried 36 MB of parquet at
runtime. The claim that justifies the replacement is that the numbers did not
change -- so it gets checked rather than asserted.

Nothing here imports 05_build_web_json.py. Every figure is re-derived from the
parquet using the same expressions the Streamlit pages used (the page and tab are
named above each block), so a mistake copied out of the pipeline cannot pass:
both sides would have to be wrong in the same direction.

Kaplan-Meier is checked against `lifelines` itself, which is what the Streamlit
page called. That is the one number here worth an external reference -- the
survival estimate and its log-log bounds are easy to get subtly wrong, and being
within 1e-4 of the reference implementation across two years of follow-up is the
only convincing evidence otherwise.

This cannot run in CI: it needs data/processed/*.parquet, which lives in
gs://da-portfolio-data-assets and is never committed. Run it locally after any
change to the pipeline.

Usage:
    pip install pyarrow lifelines
    python data-pipeline/06_verify_parity.py     # exits non-zero on any mismatch
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
P = HERE.parent / "data" / "processed"
D = HERE.parent / "web" / "public" / "cohorts" / "data"

if not P.exists() or not any(P.glob("*.parquet")):
    sys.exit(f"no parquet in {P} -- pull it from gs://da-portfolio-data-assets/cohort-processed")

J = {f.stem: json.loads(f.read_text()) for f in D.glob("*.json")}

fails = []


def check(label, got, want, tol=0.0):
    if want is None or got is None:
        ok = got is want
    else:
        ok = abs(float(got) - float(want)) <= tol
    print(f"  {'OK  ' if ok else 'FAIL'} {label:52} json={got!s:>14}  streamlit={want!s:>14}")
    if not ok:
        fails.append(label)


rfm = pd.read_parquet(P / "rfm_segments.parquet")
cust = pd.read_parquet(P / "customers_summary.parquet")
orders = pd.read_parquet(P / "orders_enriched.parquet")

# ---- Lorenz / Gini: page 3 tab_lorenz, verbatim ----
print("\nLorenz (page 3, tab_lorenz)")
revenue_sorted = np.sort(rfm["total_revenue"].values)
n = len(revenue_sorted)
cum_revenue = np.cumsum(revenue_sorted) / revenue_sorted.sum()
cum_population = np.arange(1, n + 1) / n
_trapz = getattr(np, "trapezoid", None) or np.trapz
gini = 1 - 2 * _trapz(cum_revenue, cum_population)
top_20_rev = cum_revenue[int(0.8 * n)]

lz = J["segments"]["lorenz"]
check("gini", lz["gini"], gini, 0.0005)
check("top20_share (%)", lz["top20_share"], (1 - top_20_rev) * 100, 0.05)
check("customers", lz["customers"], n)
# The downsampled curve must sit on the exact one.
err = max(
    abs(lz["revenue"][i] - np.interp(lz["population"][i], cum_population, cum_revenue))
    for i in range(len(lz["population"]))
)
check("max downsample error vs exact curve", round(err, 5), 0.0, 0.002)

# ---- Funnel: page 1 tab_ret, verbatim ----
print("\nRepeat-purchase funnel (page 1, tab_ret)")
pc = cust["total_orders"].value_counts().sort_index()
first = len(cust)
want = {
    "customers": first,
    "orders_2": int(pc[pc.index >= 2].sum()),
    "orders_3": int(pc[pc.index >= 3].sum()),
    "orders_4": int(pc[pc.index >= 4].sum()),
}
for k, v in want.items():
    check(f"funnel {k} (all cohorts)", sum(r[k] for r in J["overview"]["by_cohort"]), v)

# ---- Kaplan-Meier: page 2 tab_km, against lifelines itself ----
print("\nKaplan-Meier (page 2, tab_km)")
surv = pd.read_parquet(P / "survival_data.parquet")
sc = surv[
    surv["duration_days"].notna() & surv["event_observed"].notna() & (surv["duration_days"] > 0)
].copy()
check("N after the page's own cleaning", J["survival"]["n"], len(sc))
check("events", J["survival"]["events"], int(sc["event_observed"].sum()))

try:
    from lifelines import KaplanMeierFitter

    kmf = KaplanMeierFitter().fit(sc["duration_days"], sc["event_observed"])
    sf = kmf.survival_function_.iloc[:, 0]
    ci = kmf.confidence_interval_survival_function_
    # Grid points only (weekly): asof() gives the step value the JSON carries.
    for t in (7, 28, 91, 182, 364, 714):
        idx = J["survival"]["days"].index(t)
        ref = sf.asof(t)
        check(f"S({t}d)", J["survival"]["survival"][idx], ref, 1e-4)
        lo = ci.iloc[:, 0].asof(t)
        hi = ci.iloc[:, 1].asof(t)
        check(f"  CI lower({t}d)", J["survival"]["ci_lower"][idx], lo, 2e-3)
        check(f"  CI upper({t}d)", J["survival"]["ci_upper"][idx], hi, 2e-3)
    med = kmf.median_survival_time_
    check("median", J["survival"]["median"], None if np.isinf(med) else med)
except ImportError:
    print("  SKIP lifelines not installed -- CI and S(t) unverified against reference")

# ---- Geography: page 4 state metrics, verbatim ----
print("\nGeography (page 4) -- unfiltered, summing every cohort/month")
sm = (
    cust.groupby("customer_state")
    .agg(
        clientes=("customer_state", "size"),
        ingresos=("total_revenue", "sum"),
        aov=("avg_order_value", "mean"),
        retencion=("is_repeat_customer", "mean"),
    )
    .reset_index()
)
so = (
    orders.groupby("customer_state")
    .agg(
        pedidos=("order_id", "nunique"),
        review_prom=("review_score", "mean"),
        entrega_prom=("delivery_days", "mean"),
    )
    .reset_index()
)
ref = sm.merge(so, on="customer_state").set_index("customer_state")

bc, bm = J["geography"]["by_state_cohort"], J["geography"]["by_state_month"]
for st in ["SP", "RJ", "MG", "BA", "RS"]:
    c = [r for r in bc if r["state"] == st]
    m = [r for r in bm if r["state"] == st]
    r = ref.loc[st]
    check(f"{st} clientes", sum(x["customers"] for x in c), r.clientes)
    check(f"{st} ingresos", sum(x["revenue"] for x in c), r.ingresos, 1.0)
    check(f"{st} aov (mean of means)", sum(x["aov_sum"] for x in c) / sum(x["customers"] for x in c), r.aov, 0.01)
    check(f"{st} retencion %", sum(x["repeat"] for x in c) / sum(x["customers"] for x in c) * 100, r.retencion * 100, 0.01)
    check(f"{st} pedidos", sum(x["orders"] for x in m), r.pedidos)
    check(f"{st} review", sum(x["review_sum"] for x in m) / sum(x["review_n"] for x in m), r.review_prom, 0.01)
    check(f"{st} entrega", sum(x["delivery_sum"] for x in m) / sum(x["delivery_n"] for x in m), r.entrega_prom, 0.05)

# ---- State retention curves: page 4 chart 3, verbatim ----
print("\nState retention curves (page 4, chart 3)")
sc2 = (
    orders.groupby(["customer_state", "months_since_cohort"])["customer_unique_id"]
    .nunique()
    .reset_index(name="clientes")
)
rc = J["geography"]["retention_curves"]
for st in ["SP", "RJ", "MG"]:
    for m in (0, 1, 3):
        got = sum(r["customers"] for r in rc if r["state"] == st and r["month"] == m)
        want_v = sc2[(sc2.customer_state == st) & (sc2.months_since_cohort == m)]["clientes"]
        # Summing distinct-customer counts across cohorts equals the overall
        # distinct count only because a customer belongs to exactly one cohort.
        check(f"{st} month {m} customers", got, int(want_v.iloc[0]) if len(want_v) else 0)

print(f"\n{'ALL PARITY CHECKS PASSED' if not fails else str(len(fails)) + ' FAILED: ' + ', '.join(fails)}")
raise SystemExit(1 if fails else 0)
