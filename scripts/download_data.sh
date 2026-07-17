#!/usr/bin/env bash
# CoLLM — Dataset download script
set -e

mkdir -p data/ml-1m data/amazon-book

echo "╔══════════════════════════════════════╗"
echo "║     CoLLM Dataset Downloader         ║"
echo "╚══════════════════════════════════════╝"

# ML-1M
echo ""
echo "📥 Downloading MovieLens-1M..."
if [ ! -f "data/ml-1m/ratings.dat" ]; then
    wget -q --show-progress \
        "https://files.grouplens.org/datasets/movielens/ml-1m.zip" \
        -O /tmp/ml-1m.zip
    unzip -q /tmp/ml-1m.zip -d /tmp/
    mv /tmp/ml-1m/ratings.dat  data/ml-1m/
    mv /tmp/ml-1m/movies.dat   data/ml-1m/
    mv /tmp/ml-1m/users.dat    data/ml-1m/
    rm -f /tmp/ml-1m.zip
    echo "  ✅ ML-1M downloaded to data/ml-1m/"
else
    echo "  ⏭  ML-1M already exists, skipping."
fi

# Amazon-Books
echo ""
echo "📥 Downloading Amazon-Books (2017, filtered)..."
echo "  ⚠️  This dataset is large (~3 GB). Downloading a smaller version..."
if [ ! -f "data/amazon-book/Books.json.gz" ]; then
    wget -q --show-progress \
        "https://jmcauley.ucsd.edu/data/amazon_v2/categoryFiles/Books.json.gz" \
        -O data/amazon-book/Books.json.gz || {
        echo "  ❌ Could not download Amazon-Books (requires access agreement)."
        echo "     Visit: https://cseweb.ucsd.edu/~jmcauley/datasets.html#amazon_reviews"
        echo "     and download Books.json.gz manually to data/amazon-book/"
    }
    echo "  ✅ Amazon-Books downloaded to data/amazon-book/"
else
    echo "  ⏭  Amazon-Books already exists, skipping."
fi

echo ""
echo "🔧 Running preprocessing..."
cd "$(dirname "$0")/.."
python3 scripts/preprocess.py

echo ""
echo "✅ All done! Data ready in data/processed/"
