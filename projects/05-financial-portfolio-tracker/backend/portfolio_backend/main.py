"""FastAPI application for the Financial Portfolio Tracker backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from portfolio_backend.routers import (
    correlation,
    frontier,
    montecarlo,
    overview,
    performance,
    risk,
)

app = FastAPI(
    title="Financial Portfolio Tracker API",
    version="1.0.0",
    description="Real-time portfolio analytics: risk, returns, Monte Carlo, efficient frontier.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(overview.router, prefix="/api/v1")
app.include_router(performance.router, prefix="/api/v1")
app.include_router(risk.router, prefix="/api/v1")
app.include_router(correlation.router, prefix="/api/v1")
app.include_router(montecarlo.router, prefix="/api/v1")
app.include_router(frontier.router, prefix="/api/v1")


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "portfolio-tracker",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("portfolio_backend.main:app", host="0.0.0.0", port=2055, reload=True)
