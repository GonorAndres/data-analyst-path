#!/bin/bash
# Start the consolidated DA Portfolio API (insurance + olist) on port 8080
cd "$(dirname "$0")/.."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
