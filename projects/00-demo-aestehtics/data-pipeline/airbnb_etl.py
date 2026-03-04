"""
Airbnb CDMX ETL Pipeline
Reads listings.csv.gz and outputs 5 JSON files for the dashboard.
"""

import json
import os
from datetime import date

import numpy as np
import pandas as pd

# ── Paths ──────────────────────────────────────────────────────────────
RAW_PATH = os.path.join(os.path.dirname(__file__), "raw-data", "listings.csv.gz")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "airbnb")


def clean_price(series: pd.Series) -> pd.Series:
    """Strip $, commas and convert to float."""
    return series.str.replace("$", "", regex=False).str.replace(",", "", regex=False).astype(float)


def load_data() -> pd.DataFrame:
    cols = [
        "id", "name", "latitude", "longitude", "price", "room_type",
        "neighbourhood_cleansed", "review_scores_rating", "number_of_reviews",
        "host_id", "host_name", "calculated_host_listings_count",
        "availability_30", "availability_365", "minimum_nights",
    ]
    df = pd.read_csv(RAW_PATH, usecols=cols)
    # Clean price
    df["price"] = clean_price(df["price"])
    return df


# ── JSON builders ──────────────────────────────────────────────────────

def build_kpis(df: pd.DataFrame) -> dict:
    return {
        "total_listings": int(df.shape[0]),
        "avg_price_per_night": round(float(df["price"].mean()), 2),
        "avg_review_score": round(float(df["review_scores_rating"].mean()), 2),
        "median_availability_30": int(df["availability_30"].median()),
        "currency": "MXN",
        "updated": str(date.today()),
    }


def build_price_distribution(df: pd.DataFrame) -> dict:
    valid = df.dropna(subset=["price"])
    cap = valid["price"].quantile(0.99)
    valid = valid[valid["price"] <= cap]

    bin_edges = list(range(0, int(cap) + 500, 500))
    if bin_edges[-1] < cap:
        bin_edges.append(bin_edges[-1] + 500)

    result = {"bins": bin_edges, "room_types": {}}
    for rt in sorted(valid["room_type"].unique()):
        counts, _ = np.histogram(valid.loc[valid["room_type"] == rt, "price"], bins=bin_edges)
        result["room_types"][rt] = counts.tolist()
    return result


def build_geo_heatmap(df: pd.DataFrame, max_points: int = 3000) -> dict:
    valid = df.dropna(subset=["latitude", "longitude", "price"]).copy()
    if len(valid) > max_points:
        valid = valid.sample(max_points, random_state=42)

    points = []
    for _, r in valid.iterrows():
        points.append({
            "lat": round(float(r["latitude"]), 5),
            "lon": round(float(r["longitude"]), 5),
            "price": round(float(r["price"]), 0),
            "name": r["name"] if pd.notna(r["name"]) else "",
            "room_type": r["room_type"],
            "neighbourhood": r["neighbourhood_cleansed"],
        })
    return {"points": points}


def build_neighborhood_ranking(df: pd.DataFrame, top_n: int = 20) -> dict:
    grp = df.groupby("neighbourhood_cleansed").agg(
        listing_count=("id", "count"),
        avg_price=("price", "mean"),
        avg_rating=("review_scores_rating", "mean"),
    ).sort_values("listing_count", ascending=False).head(top_n).reset_index()

    neighborhoods = []
    for _, r in grp.iterrows():
        neighborhoods.append({
            "name": r["neighbourhood_cleansed"],
            "listing_count": int(r["listing_count"]),
            "avg_price": round(float(r["avg_price"]), 0),
            "avg_rating": round(float(r["avg_rating"]), 2) if pd.notna(r["avg_rating"]) else None,
        })
    return {"neighborhoods": neighborhoods}


def build_host_segmentation(df: pd.DataFrame) -> dict:
    # Build host-level table
    hosts = df.groupby("host_id").agg(
        host_name=("host_name", "first"),
        listing_count=("id", "count"),
        avg_price=("price", "mean"),
    ).reset_index()

    def segment(n):
        if n == 1:
            return "casual"
        elif n <= 5:
            return "professional"
        return "enterprise"

    hosts["segment"] = hosts["listing_count"].apply(segment)

    labels = {"casual": "Casual Host", "professional": "Professional Host", "enterprise": "Enterprise Host"}
    segments = []
    for seg_name in ["casual", "professional", "enterprise"]:
        seg = hosts[hosts["segment"] == seg_name]
        top5 = seg.nlargest(5, "listing_count")
        sample = []
        for _, h in top5.iterrows():
            sample.append({
                "host_name": h["host_name"] if pd.notna(h["host_name"]) else "Unknown",
                "listing_count": int(h["listing_count"]),
                "avg_price": round(float(h["avg_price"]), 0) if pd.notna(h["avg_price"]) else 0,
            })
        segments.append({
            "name": seg_name,
            "label": labels[seg_name],
            "host_count": int(seg.shape[0]),
            "avg_listings": round(float(seg["listing_count"].mean()), 1),
            "avg_price": round(float(seg["avg_price"].mean()), 0) if not seg["avg_price"].isna().all() else 0,
            "total_listings": int(seg["listing_count"].sum()),
            "sample_hosts": sample,
        })
    return {"segments": segments}


# ── Main ───────────────────────────────────────────────────────────────

def write_json(data: dict, filename: str) -> int:
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    size = os.path.getsize(path)
    print(f"  {filename}: {size / 1024:.1f} KB")
    return size


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Loading data...")
    df = load_data()
    print(f"  Loaded {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"  Price nulls: {df['price'].isna().sum()}")
    print(f"  Rating nulls: {df['review_scores_rating'].isna().sum()}")

    print("\nBuilding JSON files...")
    write_json(build_kpis(df), "kpis.json")
    write_json(build_price_distribution(df), "price_distribution.json")
    write_json(build_geo_heatmap(df), "geo_heatmap.json")
    write_json(build_neighborhood_ranking(df), "neighborhood_ranking.json")
    write_json(build_host_segmentation(df), "host_segmentation.json")

    print("\nDone.")


if __name__ == "__main__":
    main()
