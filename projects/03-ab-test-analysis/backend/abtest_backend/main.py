"""FastAPI application for A/B Test Analysis backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from abtest_backend import data_loader
from abtest_backend.routers import (
    bayesian,
    frequentist,
    overview,
    power,
    segments,
    sequential,
)

app = FastAPI(title="A/B Test Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3050",
        "http://localhost:3051",
        "http://localhost:3053",
        "https://*.vercel.app",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(overview.router, prefix="/api/v1")
app.include_router(frequentist.router, prefix="/api/v1")
app.include_router(bayesian.router, prefix="/api/v1")
app.include_router(segments.router, prefix="/api/v1")
app.include_router(power.router, prefix="/api/v1")
app.include_router(sequential.router, prefix="/api/v1")


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "rows_loaded": len(data_loader.df),
        "filters_available": {
            "device_types": len(data_loader.DEVICE_TYPES),
            "browsers": len(data_loader.BROWSERS),
            "countries": len(data_loader.COUNTRIES),
            "user_segments": len(data_loader.USER_SEGMENTS),
            "traffic_sources": len(data_loader.TRAFFIC_SOURCES),
        },
    }


@app.get("/api/v1/filters")
def filters():
    """Return all available filter values for the frontend."""
    return {
        "device_types": data_loader.DEVICE_TYPES,
        "browsers": data_loader.BROWSERS,
        "countries": data_loader.COUNTRIES,
        "user_segments": data_loader.USER_SEGMENTS,
        "traffic_sources": data_loader.TRAFFIC_SOURCES,
    }
