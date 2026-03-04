import os

import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

try:
    orders: pd.DataFrame = pd.read_parquet(os.path.join(DATA_DIR, "orders.parquet"))
    print(f"  Loaded orders: {len(orders):,} rows")
except FileNotFoundError:
    print("  WARNING: orders.parquet not found — using empty DataFrame")
    orders = pd.DataFrame()

try:
    order_items: pd.DataFrame = pd.read_parquet(os.path.join(DATA_DIR, "order_items.parquet"))
    print(f"  Loaded order_items: {len(order_items):,} rows")
except FileNotFoundError:
    print("  WARNING: order_items.parquet not found — using empty DataFrame")
    order_items = pd.DataFrame()

try:
    products: pd.DataFrame = pd.read_parquet(os.path.join(DATA_DIR, "products.parquet"))
    print(f"  Loaded products: {len(products):,} rows")
except FileNotFoundError:
    print("  WARNING: products.parquet not found — using empty DataFrame")
    products = pd.DataFrame()

PRODUCT_CATEGORIES = sorted(order_items["product_category_name"].dropna().unique().tolist()) if "product_category_name" in order_items.columns else []
STATES = sorted(orders["customer_state"].dropna().unique().tolist()) if "customer_state" in orders.columns else []
PAYMENT_TYPES = sorted(orders["payment_type"].dropna().unique().tolist()) if "payment_type" in orders.columns else []
