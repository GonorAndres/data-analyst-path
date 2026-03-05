FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY olist_backend/ ./olist_backend/
COPY data/ ./data/
EXPOSE 8080
CMD ["uvicorn", "olist_backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
