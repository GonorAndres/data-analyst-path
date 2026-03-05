from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from insurance_backend import data_loader
from insurance_backend.routers import (
    claim_distribution,
    combined_ratio,
    frequency_severity,
    loss_ratios,
    loss_triangle,
)

app = FastAPI(title="Insurance Claims API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3050",
        "http://localhost:3051",
        "https://*.vercel.app",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(loss_triangle.router, prefix="/api/v1")
app.include_router(frequency_severity.router, prefix="/api/v1")
app.include_router(loss_ratios.router, prefix="/api/v1")
app.include_router(combined_ratio.router, prefix="/api/v1")
app.include_router(claim_distribution.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "triangles_loaded": len(data_loader.triangles),
        "claims_loaded": len(data_loader.claims),
        "ibnr_loaded": len(data_loader.ibnr_results),
        "lob_summary_loaded": len(data_loader.lob_summary),
    }


@app.get("/api/v1/filters")
def filters():
    return {
        "lines_of_business": data_loader.LINES_OF_BUSINESS,
        "companies": data_loader.COMPANIES,
        "accident_years": data_loader.ACCIDENT_YEARS,
    }


@app.get("/api/v1/kpis")
def kpis(
    lob: str = None,
    company: int = None,
    year_start: int = None,
    year_end: int = None,
):
    from insurance_backend.filters import apply_filters

    # KPIs from triangles (latest development lag per accident year)
    tri = apply_filters(data_loader.triangles, lob, company, year_start, year_end)
    # Take the most mature observation per accident year & company
    if not tri.empty:
        latest = tri.loc[tri.groupby(["GRCODE", "AccidentYear"])["DevelopmentLag"].idxmax()]
        total_incurred = int(latest["IncurLoss"].sum())
        total_paid = int(latest["CumPaidLoss"].sum())
        total_premium = int(latest["EarnedPremDIR"].sum())
        avg_loss_ratio = round(float(latest["loss_ratio"].mean()), 4)
    else:
        total_incurred = 0
        total_paid = 0
        total_premium = 0
        avg_loss_ratio = 0.0

    # KPIs from claims
    cl = apply_filters(data_loader.claims, lob, None, year_start, year_end)
    total_claims = int(len(cl))
    open_claims = int((cl["claim_status"] == "Open").sum()) if "claim_status" in cl.columns and not cl.empty else 0
    avg_severity = round(float(cl["incurred_amount"].mean()), 2) if "incurred_amount" in cl.columns and not cl.empty else 0.0
    avg_report_lag = round(float(cl["report_lag_days"].mean()), 1) if "report_lag_days" in cl.columns and not cl.empty else 0.0

    # KPIs from IBNR
    ibnr = apply_filters(data_loader.ibnr_results, lob, None, year_start, year_end)
    total_ibnr_paid = int(ibnr["ibnr_cl_paid"].sum()) if "ibnr_cl_paid" in ibnr.columns and not ibnr.empty else 0
    total_ibnr_bf = int(ibnr["ibnr_bf"].sum()) if "ibnr_bf" in ibnr.columns and not ibnr.empty else 0

    return {
        "total_incurred": total_incurred,
        "total_paid": total_paid,
        "total_premium": total_premium,
        "avg_loss_ratio": avg_loss_ratio,
        "total_claims": total_claims,
        "open_claims": open_claims,
        "avg_severity": avg_severity,
        "avg_report_lag_days": avg_report_lag,
        "total_ibnr_cl_paid": total_ibnr_paid,
        "total_ibnr_bf": total_ibnr_bf,
    }
