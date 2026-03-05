"""
Olist E-Commerce ETL Pipeline
Reads 7 CSVs from raw-data/olist/ and outputs parquets for the dashboard API.
"""

import os
import sys

import pandas as pd

# -- Paths ------------------------------------------------------------------
RAW_DIR = os.path.join(os.path.dirname(__file__), "raw-data", "olist")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data")


def load_csv(filename: str, **kwargs) -> pd.DataFrame:
    """Load a CSV from the raw-data/olist directory."""
    path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(path):
        print(f"  WARNING: {filename} not found at {path}")
        return pd.DataFrame()
    df = pd.read_csv(path, **kwargs)
    print(f"  {filename}: {df.shape[0]:,} rows, {df.shape[1]} columns")
    return df


def build_orders(
    orders: pd.DataFrame,
    customers: pd.DataFrame,
    payments: pd.DataFrame,
    reviews: pd.DataFrame,
    order_items: pd.DataFrame,
    products: pd.DataFrame,
    translations: pd.DataFrame,
) -> pd.DataFrame:
    """Enrich orders with derived columns needed by the API."""
    if orders.empty:
        return orders

    # Parse timestamps
    for col in ["order_purchase_timestamp", "order_delivered_customer_date", "order_estimated_delivery_date"]:
        orders[col] = pd.to_datetime(orders[col], errors="coerce")

    # order_month
    orders["order_month"] = orders["order_purchase_timestamp"].dt.to_period("M").astype(str)

    # delivery_days
    orders["delivery_days"] = (
        orders["order_delivered_customer_date"] - orders["order_purchase_timestamp"]
    ).dt.days

    # late_delivery
    orders["late_delivery"] = (
        orders["order_delivered_customer_date"] > orders["order_estimated_delivery_date"]
    )

    # total_payment per order
    if not payments.empty:
        total_pay = payments.groupby("order_id")["payment_value"].sum().reset_index()
        total_pay.columns = ["order_id", "total_payment"]
        orders = orders.merge(total_pay, on="order_id", how="left")

        # Most common payment_type per order
        pay_type = (
            payments.groupby("order_id")["payment_type"]
            .agg(lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else x.iloc[0])
            .reset_index()
        )
        pay_type.columns = ["order_id", "payment_type"]
        orders = orders.merge(pay_type, on="order_id", how="left")

    # review_score (first per order)
    if not reviews.empty:
        first_review = reviews.drop_duplicates(subset=["order_id"], keep="first")[["order_id", "review_score"]]
        orders = orders.merge(first_review, on="order_id", how="left")

    # customer_state + customer_unique_id
    if not customers.empty:
        orders = orders.merge(
            customers[["customer_id", "customer_unique_id", "customer_state"]],
            on="customer_id",
            how="left",
        )

    # product_category_name (first item per order)
    if not order_items.empty and not products.empty:
        items_with_cat = order_items.merge(products[["product_id", "product_category_name"]], on="product_id", how="left")
        if not translations.empty:
            items_with_cat = items_with_cat.merge(
                translations, on="product_category_name", how="left",
            )
            items_with_cat["product_category_name"] = items_with_cat[
                "product_category_name_english"
            ].fillna(items_with_cat["product_category_name"])
            items_with_cat.drop(columns=["product_category_name_english"], inplace=True)

        first_item_cat = items_with_cat.drop_duplicates(subset=["order_id"], keep="first")[
            ["order_id", "product_category_name"]
        ]
        orders = orders.merge(first_item_cat, on="order_id", how="left")

    # cohort_month: min order_month per customer
    if "customer_unique_id" in orders.columns:
        cohort = orders.groupby("customer_unique_id")["order_month"].min().reset_index()
        cohort.columns = ["customer_unique_id", "cohort_month"]
        orders = orders.merge(cohort, on="customer_unique_id", how="left")

        # months_since_cohort
        order_period = pd.PeriodIndex(orders["order_month"], freq="M")
        cohort_period = pd.PeriodIndex(orders["cohort_month"], freq="M")
        orders["months_since_cohort"] = (order_period - cohort_period).map(
            lambda x: x.n if hasattr(x, "n") else 0
        )

    return orders


def build_order_items(
    order_items: pd.DataFrame,
    products: pd.DataFrame,
    translations: pd.DataFrame,
) -> pd.DataFrame:
    """Enrich order_items with translated category names."""
    if order_items.empty:
        return order_items

    if not products.empty:
        order_items = order_items.merge(
            products[["product_id", "product_category_name"]],
            on="product_id",
            how="left",
        )
        if not translations.empty:
            order_items = order_items.merge(translations, on="product_category_name", how="left")
            order_items["product_category_name"] = order_items[
                "product_category_name_english"
            ].fillna(order_items["product_category_name"])
            order_items.drop(columns=["product_category_name_english"], inplace=True)

    return order_items


def write_parquet(df: pd.DataFrame, filename: str) -> None:
    """Write a DataFrame to parquet in the output directory."""
    path = os.path.join(OUT_DIR, filename)
    df.to_parquet(path, index=False)
    size = os.path.getsize(path)
    print(f"  {filename}: {size / 1024:.1f} KB ({df.shape[0]:,} rows)")


# -- Main -------------------------------------------------------------------

def main():
    if not os.path.isdir(RAW_DIR):
        print(f"ERROR: Raw data directory not found: {RAW_DIR}")
        print("Please place the Olist CSV files in that directory and re-run.")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)

    print("Loading CSVs...")
    orders = load_csv("olist_orders_dataset.csv")
    customers = load_csv("olist_customers_dataset.csv")
    order_items = load_csv("olist_order_items_dataset.csv")
    products = load_csv("olist_products_dataset.csv")
    payments = load_csv("olist_order_payments_dataset.csv")
    reviews = load_csv("olist_order_reviews_dataset.csv")
    translations = load_csv("product_category_name_translation.csv")

    print("\nBuilding enriched orders...")
    enriched_orders = build_orders(orders, customers, payments, reviews, order_items, products, translations)

    print("\nBuilding enriched order_items...")
    enriched_items = build_order_items(order_items, products, translations)

    print("\nWriting parquets...")
    write_parquet(enriched_orders, "orders.parquet")
    write_parquet(enriched_items, "order_items.parquet")
    if not customers.empty:
        write_parquet(customers, "customers.parquet")
    if not products.empty:
        write_parquet(products, "products.parquet")

    print("\nDone.")


if __name__ == "__main__":
    main()
