"""Unified DA Portfolio API -- mounts insurance and olist sub-applications."""

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add both project backend directories to sys.path
PROJECTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "projects")
sys.path.insert(0, os.path.join(PROJECTS, "01-insurance-claims-dashboard", "backend"))
sys.path.insert(0, os.path.join(PROJECTS, "00-demo-aestehtics", "backend"))

from insurance_backend.main import app as insurance_app  # noqa: E402
from olist_backend.main import app as olist_app  # noqa: E402

app = FastAPI(title="DA Portfolio API", version="1.0.0")

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

app.mount("/insurance", insurance_app)
app.mount("/olist", olist_app)


@app.get("/health")
def health():
    return {"status": "ok", "services": ["insurance", "olist"]}
