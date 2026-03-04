from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import data_loader
from app.routers import categories, cohort, delivery, geo, ltv, revenue, rfm

app = FastAPI(title="Olist API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3050", "https://*.vercel.app"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(cohort.router, prefix="/api/v1")
app.include_router(ltv.router, prefix="/api/v1")
app.include_router(geo.router, prefix="/api/v1")
app.include_router(rfm.router, prefix="/api/v1")
app.include_router(delivery.router, prefix="/api/v1")
app.include_router(revenue.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "orders_loaded": len(data_loader.orders)}


@app.get("/api/v1/filters")
def filters():
    return {
        "product_categories": data_loader.PRODUCT_CATEGORIES,
        "states": data_loader.STATES,
        "payment_types": data_loader.PAYMENT_TYPES,
    }


@app.get("/api/v1/kpis")
def kpis(
    category: str = None,
    state: str = None,
    payment_type: str = None,
    year_start: int = None,
    year_end: int = None,
):
    from app.filters import apply_filters

    df = apply_filters(data_loader.orders, category, state, payment_type, year_start, year_end)
    return {
        "total_orders": int(len(df)),
        "unique_customers": int(df["customer_unique_id"].nunique()) if "customer_unique_id" in df.columns else 0,
        "avg_order_value": round(float(df["total_payment"].mean()), 2) if "total_payment" in df.columns and len(df) > 0 else 0.0,
        "avg_delivery_days": round(float(df["delivery_days"].mean()), 1) if "delivery_days" in df.columns and len(df) > 0 else 0.0,
    }
