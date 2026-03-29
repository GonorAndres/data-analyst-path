# Build from repo root: docker build -f projects/02-ecommerce-cohort-analysis/Dockerfile .
FROM python:3.11-slim
WORKDIR /app

COPY projects/02-ecommerce-cohort-analysis/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Inject Google Analytics into Streamlit's index.html
RUN STHTML=$(python -c "import streamlit,os;print(os.path.join(os.path.dirname(streamlit.__file__),'static','index.html'))") && \
    sed -i 's|</head>|<script async src="https://www.googletagmanager.com/gtag/js?id=G-098V02NCB0"></script><script>window.dataLayer=window.dataLayer\|\|[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-098V02NCB0");</script></head>|' "$STHTML"

# Streamlit app
COPY projects/02-ecommerce-cohort-analysis/streamlit/ ./streamlit/

# Processed data (relative path expected by data_loader: ../../data/processed/)
COPY projects/02-ecommerce-cohort-analysis/data/processed/ ./data/processed/

EXPOSE 8501
CMD ["streamlit", "run", "streamlit/app.py", "--server.port=8501", "--server.address=0.0.0.0", "--server.headless=true"]
