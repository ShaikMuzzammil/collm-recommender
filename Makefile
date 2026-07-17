# ══════════════════════════════════════════════════════════════════
#  CoLLM — Makefile
#  Usage: make <target>
# ══════════════════════════════════════════════════════════════════

.PHONY: help setup dev-backend dev-frontend dev docker docker-prod \
        data preprocess train test-backend test-frontend lint clean

PYTHON   := python3
PIP      := pip3
NPM      := npm
UVICORN  := uvicorn
DC       := docker compose

# ── Default ───────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  CoLLM — Available commands"
	@echo "  ─────────────────────────────────────────────────"
	@echo "  make setup          Install all dependencies"
	@echo "  make dev-backend    Run FastAPI dev server  (port 8000)"
	@echo "  make dev-frontend   Run React dev server    (port 3000)"
	@echo "  make dev            Run both concurrently"
	@echo "  make docker         Docker Compose (local dev)"
	@echo "  make docker-prod    Docker Compose (production images)"
	@echo "  make data           Download + preprocess both datasets"
	@echo "  make preprocess     Preprocess already-downloaded data"
	@echo "  make train          CLI training — all 4 models"
	@echo "  make test-backend   Python smoke test"
	@echo "  make test-frontend  React build test"
	@echo "  make lint           Flake8 + ESLint"
	@echo "  make clean          Remove __pycache__, build/, node_modules"
	@echo ""

# ── Setup ─────────────────────────────────────────────────────────
setup:
	@echo "→ Installing backend dependencies..."
	cd backend && $(PIP) install -r requirements.txt
	@echo "→ Installing frontend dependencies..."
	cd frontend && $(NPM) install
	@echo "✅ Setup complete."

# ── Dev servers ───────────────────────────────────────────────────
dev-backend:
	cd backend && $(UVICORN) main:app --host 0.0.0.0 --port 8000 --reload

dev-frontend:
	cd frontend && REACT_APP_API_URL=http://localhost:8000 $(NPM) start

dev:
	@echo "→ Starting backend and frontend concurrently..."
	@(make dev-backend &) && make dev-frontend

# ── Docker ────────────────────────────────────────────────────────
docker:
	$(DC) up --build

docker-down:
	$(DC) down

docker-prod:
	GITHUB_REPOSITORY=$(shell git config --get remote.origin.url | sed 's/.*github.com[:/]//' | sed 's/.git//') \
	$(DC) -f docker-compose.prod.yml up

docker-clean:
	$(DC) down -v --rmi local

# ── Data pipeline ─────────────────────────────────────────────────
data:
	@echo "→ Downloading datasets..."
	bash scripts/download_data.sh

preprocess:
	@echo "→ Preprocessing with default paths..."
	$(PYTHON) scripts/preprocess.py --dataset both

preprocess-ml1m:
	$(PYTHON) scripts/preprocess.py --dataset ml1m

preprocess-amazon:
	$(PYTHON) scripts/preprocess.py --dataset amazon

# ── Training ──────────────────────────────────────────────────────
train:
	@echo "→ Training all 4 collaborative models..."
	$(PYTHON) scripts/train.py --dataset ml1m   --model mf        --epochs 10
	$(PYTHON) scripts/train.py --dataset ml1m   --model lightgcn  --epochs 10
	$(PYTHON) scripts/train.py --dataset ml1m   --model sasrec    --epochs 10
	$(PYTHON) scripts/train.py --dataset ml1m   --model din       --epochs 10

train-mf:
	$(PYTHON) scripts/train.py --dataset ml1m --model mf --epochs 10

train-lightgcn:
	$(PYTHON) scripts/train.py --dataset ml1m --model lightgcn --epochs 10

train-sasrec:
	$(PYTHON) scripts/train.py --dataset ml1m --model sasrec --epochs 10

train-din:
	$(PYTHON) scripts/train.py --dataset ml1m --model din --epochs 10

# ── Tests ─────────────────────────────────────────────────────────
test-backend:
	@echo "→ Running backend smoke tests..."
	cd backend && $(PYTHON) -m py_compile main.py && echo "✅ Syntax OK"
	cd backend && $(PYTHON) - <<'EOF'
import sys; sys.path.insert(0, 'backend')
from main import CoLLM, Config, CIEModule
import torch
cfg = Config(); cfg.num_users = 50; cfg.num_items = 100
for m in ['mf','lightgcn','sasrec','din']:
    model = CoLLM(cfg, m)
    tok  = torch.randint(0, 1000, (2, 64))
    u    = torch.randint(0, 50,   (2,))
    i    = torch.randint(0, 100,  (2,))
    seq  = torch.zeros(2, 50, dtype=torch.long)
    slen = torch.tensor([3, 5])
    hist = torch.zeros(2, 10, dtype=torch.long)
    hlen = torch.tensor([3, 5])
    with torch.no_grad():
        out = model(tok, u, i, use_collab=True, seq=seq, seq_len=slen, hist=hist, hist_len=hlen)
    assert out.shape == (2,), f"Wrong shape {out.shape}"
    print(f"  ✅ {m}: {out.shape}")
print("All tests passed.")
EOF

test-frontend:
	@echo "→ Building frontend (production)..."
	cd frontend && REACT_APP_API_URL=http://localhost:8000 CI=false $(NPM) run build
	@echo "✅ Frontend build OK"

test: test-backend test-frontend

# ── Lint ──────────────────────────────────────────────────────────
lint:
	@echo "→ Flake8 (backend)..."
	cd backend && $(PYTHON) -m flake8 main.py --max-line-length=120 --ignore=E501,W503 || true
	@echo "→ ESLint (frontend)..."
	cd frontend && CI=false $(NPM) run build 2>&1 | grep -E "Warning|Error" | head -20 || true

# ── Clean ─────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -rf frontend/build frontend/node_modules
	rm -rf backend/models/*.pt
	@echo "✅ Cleaned."

clean-data:
	rm -rf data/ml-1m data/amazon-book data/processed
	@echo "✅ Data directories removed."
