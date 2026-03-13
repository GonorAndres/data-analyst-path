"""FastAPI application for Executive KPI Report backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from kpi_backend import data_loader
from kpi_backend.routers import (
    anomalies,
    customers,
    forecast,
    overview,
    report,
    revenue,
)

app = FastAPI(
    title="Executive KPI Report API",
    version="1.0.0",
    description="Backend API for NovaCRM Executive KPI Dashboard and PDF report generation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3052",
        "http://localhost:3053",
        "https://*.vercel.app",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(overview.router, prefix="/api/v1")
app.include_router(revenue.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(forecast.router, prefix="/api/v1")
app.include_router(anomalies.router, prefix="/api/v1")
app.include_router(report.router, prefix="/api/v1")


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "datasets": {
            "monthly_metrics": len(data_loader.monthly_metrics),
            "segment_metrics": len(data_loader.segment_metrics),
            "monthly_kpis": len(data_loader.monthly_kpis),
            "segment_kpis": len(data_loader.segment_kpis),
        },
        "filters_available": {
            "segments": data_loader.SEGMENTS,
            "months": len(data_loader.MONTHS),
        },
    }


@app.get("/api/v1/filters")
def filters():
    """Return all available filter values for the frontend."""
    return {
        "segments": data_loader.SEGMENTS,
        "months": data_loader.MONTHS,
    }
