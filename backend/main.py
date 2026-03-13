"""Unified DA Portfolio API -- mounts all project sub-applications."""

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add project backend directories to sys.path
PROJECTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "projects")
sys.path.insert(0, os.path.join(PROJECTS, "01-insurance-claims-dashboard", "backend"))
sys.path.insert(0, os.path.join(PROJECTS, "00-demo-aestehtics", "backend"))
sys.path.insert(0, os.path.join(PROJECTS, "03-ab-test-analysis", "backend"))
sys.path.insert(0, os.path.join(PROJECTS, "04-executive-kpi-report", "backend"))
sys.path.insert(0, os.path.join(PROJECTS, "06-operational-efficiency", "backend"))

from insurance_backend.main import app as insurance_app  # noqa: E402
from olist_backend.main import app as olist_app  # noqa: E402
from abtest_backend.main import app as abtest_app  # noqa: E402
from kpi_backend.main import app as kpi_app  # noqa: E402
from ops_backend.main import app as ops_app  # noqa: E402

app = FastAPI(title="DA Portfolio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3050",
        "http://localhost:3051",
        "http://localhost:3053",
        "http://localhost:3056",
        "https://*.vercel.app",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.mount("/insurance", insurance_app)
app.mount("/olist", olist_app)
app.mount("/abtest", abtest_app)
app.mount("/kpi", kpi_app)
app.mount("/ops", ops_app)


@app.get("/health")
def health():
    return {"status": "ok", "services": ["insurance", "olist", "abtest", "kpi", "ops"]}
