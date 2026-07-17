#!/usr/bin/env python3
"""
CoLLM Data Preprocessor
Processes ML-1M and Amazon-Book datasets into temporal train/val/test splits.

Usage:
    python preprocess.py --dataset ml1m  --raw_path data/ml-1m/ratings.dat
    python preprocess.py --dataset amazon --raw_path data/amazon-book/Books.json.gz
"""

import os, gzip, json, argparse
import pandas as pd
import numpy as np
from pathlib import Path
from collections import defaultdict

OUT = Path("data/processed")
OUT.mkdir(parents=True, exist_ok=True)


def load_ml1m(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="::", engine="python",
                     names=["user_id","item_id","rating","timestamp"])
    print(f"ML-1M raw: {len(df):,} rows, {df.user_id.nunique():,} users, {df.item_id.nunique():,} items")
    df["label"] = (df["rating"] > 3).astype(int)
    return df[["user_id","item_id","label","timestamp"]]


def load_amazon(path: str) -> pd.DataFrame:
    rows = []
    opener = gzip.open if path.endswith(".gz") else open
    with opener(path, "rt", encoding="utf-8", errors="ignore") as f:
        for line in f:
            try:
                d = json.loads(line.strip())
                if all(k in d for k in ("reviewerID","asin","overall","unixReviewTime")):
                    rows.append({
                        "user_id": d["reviewerID"], "item_id": d["asin"],
                        "rating": float(d["overall"]),
                        "timestamp": int(d["unixReviewTime"])
                    })
            except: pass
    df = pd.DataFrame(rows)
    print(f"Amazon raw: {len(df):,} rows")

    # Year 2017 only
    df = df[(df.timestamp >= 1483228800) & (df.timestamp < 1514764800)]
    print(f"Amazon 2017: {len(df):,} rows")

    # Filter sparse users/items (≥ 20 interactions)
    for _ in range(3):
        uc = df.user_id.value_counts()
        ic = df.item_id.value_counts()
        df = df[df.user_id.isin(uc[uc >= 20].index) & df.item_id.isin(ic[ic >= 20].index)]
    print(f"Amazon filtered: {len(df):,} rows, {df.user_id.nunique():,} users, {df.item_id.nunique():,} items")

    df["label"] = (df["rating"] >= 4).astype(int)
    return df[["user_id","item_id","label","timestamp"]]


def temporal_split_ml1m(df: pd.DataFrame):
    """Most recent 20 months: 10 train / 5 val / 5 test"""
    df = df.sort_values("timestamp")
    ts_min, ts_max = df.timestamp.min(), df.timestamp.max()
    month = (ts_max - ts_min) / 20
    cut1 = ts_min + 10 * month
    cut2 = ts_min + 15 * month
    return (
        df[df.timestamp < cut1],
        df[(df.timestamp >= cut1) & (df.timestamp < cut2)],
        df[df.timestamp >= cut2],
    )


def temporal_split_amazon(df: pd.DataFrame):
    """Year 2017: 11 months train / 0.5 months val / 0.5 months test"""
    df = df.sort_values("timestamp")
    ts_min = 1483228800   # 2017-01-01
    cut1   = ts_min + int(11 * 30.4 * 86400)
    cut2   = ts_min + int(11.5 * 30.4 * 86400)
    return (
        df[df.timestamp < cut1],
        df[(df.timestamp >= cut1) & (df.timestamp < cut2)],
        df[df.timestamp >= cut2],
    )


def remap_ids(train, val, test, user_col="user_id", item_col="item_id"):
    """Remap string IDs → sequential ints (0-indexed)"""
    umap = {u: i for i, u in enumerate(sorted(train[user_col].unique()))}
    imap = {it: i for i, it in enumerate(sorted(train[item_col].unique()))}
    def apply(df):
        df = df.copy()
        df[user_col] = df[user_col].map(umap)
        df[item_col] = df[item_col].map(imap)
        return df.dropna(subset=[user_col, item_col])
    return apply(train), apply(val), apply(test), umap, imap


def save_splits(name, train, val, test):
    for split, df in [("train", train), ("val", val), ("test", test)]:
        p = OUT / f"{name}_{split}.csv"
        df.to_csv(p, index=False)
        print(f"  Saved {p}: {len(df):,} rows | pos={df.label.sum():,} ({df.label.mean()*100:.1f}%)")


def print_stats(name, train, val, test):
    print(f"\n{'='*50}")
    print(f"  {name} — Final Statistics")
    print(f"{'='*50}")
    total = len(train) + len(val) + len(test)
    for split, df in [("Train", train), ("Val", val), ("Test", test)]:
        print(f"  {split}: {len(df):,} ({len(df)/total*100:.1f}%)")
    print(f"  Users: {train.user_id.nunique():,} | Items: {train.item_id.nunique():,}")
    print(f"  Positive rate: {train.label.mean()*100:.1f}%")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", choices=["ml1m","amazon","both"], default="both")
    p.add_argument("--ml1m_path",   default="data/ml-1m/ratings.dat")
    p.add_argument("--amazon_path", default="data/amazon-book/Books.json.gz")
    args = p.parse_args()

    if args.dataset in ("ml1m","both"):
        if not os.path.exists(args.ml1m_path):
            print(f"ML-1M not found at {args.ml1m_path}. Run: bash scripts/download_data.sh")
        else:
            df = load_ml1m(args.ml1m_path)
            train, val, test = temporal_split_ml1m(df)
            train, val, test, um, im = remap_ids(train, val, test)
            save_splits("ml1m", train, val, test)
            print_stats("ML-1M", train, val, test)

    if args.dataset in ("amazon","both"):
        if not os.path.exists(args.amazon_path):
            print(f"Amazon-Book not found at {args.amazon_path}. Run: bash scripts/download_data.sh")
        else:
            df = load_amazon(args.amazon_path)
            train, val, test = temporal_split_amazon(df)
            train, val, test, um, im = remap_ids(train, val, test)
            save_splits("amazon", train, val, test)
            print_stats("Amazon-Book", train, val, test)

    print("\n✅ Preprocessing complete. Files saved to data/processed/")


if __name__ == "__main__":
    main()
