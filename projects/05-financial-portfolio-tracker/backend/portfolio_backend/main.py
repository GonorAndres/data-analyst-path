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

# Matches the other five backends: localhost only, GET only. This was the one
# outlier, and it was open in a way the others never were --
# `allow_origins=["*"]` together with `allow_credentials=True` makes Starlette
# echo the caller's own Origin back with `Allow-Credentials: true`, so any site
# could make credentialed requests to it. Nothing needed that: the dashboard
# reaches this service through the hub's `/api/portfolio` Pages Function, a
# server-side fetch where no browser origin is involved at all.
#
# Port 3055 is this project's own `npm run dev`; 3000 is the Next.js default.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3055",
    ],
    allow_methods=["GET"],
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
