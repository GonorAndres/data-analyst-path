"""FastAPI application for NYC 311 Operational Efficiency backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ops_backend import data_loader
from ops_backend.routers import (
    bottleneck,
    departments,
    geographic,
    overview,
    pareto,
    trends,
)

app = FastAPI(title="NYC 311 Operational Efficiency API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3056",
        "https://*.vercel.app",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(overview.router, prefix="/api/v1")
app.include_router(bottleneck.router, prefix="/api/v1")
app.include_router(departments.router, prefix="/api/v1")
app.include_router(geographic.router, prefix="/api/v1")
app.include_router(trends.router, prefix="/api/v1")
app.include_router(pareto.router, prefix="/api/v1")


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "rows_loaded": len(data_loader.df),
        "filters_available": {
            "agencies": len(data_loader.AGENCIES),
            "complaint_types": len(data_loader.COMPLAINT_TYPES),
            "boroughs": len(data_loader.BOROUGHS),
            "channels": len(data_loader.CHANNELS),
            "year_months": len(data_loader.YEAR_MONTHS),
        },
    }


@app.get("/api/v1/filters")
def filters():
    """Return all available filter values for the frontend."""
    return {
        "agencies": data_loader.AGENCIES,
        "complaint_types": data_loader.COMPLAINT_TYPES,
        "boroughs": data_loader.BOROUGHS,
        "channels": data_loader.CHANNELS,
        "year_months": data_loader.YEAR_MONTHS,
    }
