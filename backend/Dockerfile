FROM python:3.11-slim
WORKDIR /workspace

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/main.py ./backend/

# Insurance backend + data
COPY projects/01-insurance-claims-dashboard/backend/insurance_backend/ ./projects/01-insurance-claims-dashboard/backend/insurance_backend/
COPY projects/01-insurance-claims-dashboard/data/processed/ ./projects/01-insurance-claims-dashboard/data/processed/

# Olist backend + data
COPY projects/00-demo-aestehtics/backend/olist_backend/ ./projects/00-demo-aestehtics/backend/olist_backend/
COPY projects/00-demo-aestehtics/backend/data/ ./projects/00-demo-aestehtics/backend/data/

# A/B Test backend + data
COPY projects/03-ab-test-analysis/backend/abtest_backend/ ./projects/03-ab-test-analysis/backend/abtest_backend/
COPY projects/03-ab-test-analysis/data/processed/ ./projects/03-ab-test-analysis/data/processed/

# Executive KPI backend + data
COPY projects/04-executive-kpi-report/backend/kpi_backend/ ./projects/04-executive-kpi-report/backend/kpi_backend/
COPY projects/04-executive-kpi-report/data/processed/ ./projects/04-executive-kpi-report/data/processed/

# Operational Efficiency backend + data
COPY projects/06-operational-efficiency/backend/ops_backend/ ./projects/06-operational-efficiency/backend/ops_backend/
COPY projects/06-operational-efficiency/data/processed/ ./projects/06-operational-efficiency/data/processed/

EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
