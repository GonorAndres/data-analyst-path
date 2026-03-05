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

EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
