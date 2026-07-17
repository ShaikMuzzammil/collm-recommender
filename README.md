<div align="center">

# CoLLM — Collaborative Embeddings × LLM Recommendation

**Full-stack ML capstone implementing arXiv:2310.19488**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.3-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[Paper](https://arxiv.org/abs/2310.19488) · [Original Repo](https://github.com/zyang1580/CoLLM) · [Live Demo](#deploy-to-render-free)

</div>

---

## What This Implements

CoLLM solves a fundamental LLM-recommendation gap: LLMs understand text semantics well but miss **collaborative signals** (who buys/watches/reads what together). This project builds the full system end-to-end:

```
User/Item IDs ──► Collaborative Model ──► CIE Module (MLP) ──┐
                  (MF / LightGCN /                            ├──► LLM Token Space ──► RecHead ──► Yes/No
Text Prompt   ──► LoRA Fine-tuned LLM ──────────────────────┘
```

**Two-step training:**
- **Step 1 — LoRA:** Text-only fine-tuning → cold-start recommendation ability
- **Step 2 — CIE:** Map collaborative embeddings into LLM token space → warm-start boost

**4 collaborative backbones:** MF · LightGCN · SASRec (Transformer) · DIN (Attention)

---

## Results (from Paper)

### Table 2 — Overall Performance

| Method | ML-1M AUC | ML-1M UAUC | Amazon-Book AUC | Amazon-Book UAUC | Rel. Imp. |
|---|---|---|---|---|---|
| MF | 0.6482 | 0.6361 | 0.7134 | 0.5565 | 10.3% |
| LightGCN | 0.5959 | 0.6499 | 0.7103 | 0.5639 | 13.2% |
| SASRec | 0.7078 | 0.6884 | 0.6887 | 0.5714 | 1.9% |
| DIN | 0.7166 | 0.6459 | 0.8163 | 0.6145 | 4.9% |
| TALLRec | 0.7097 | 0.6818 | 0.7375 | 0.5983 | 1.8% |
| **CoLLM-MF** | **0.7295** | **0.6875** | **0.8109** | **0.6225** | — |
| **CoLLM-DIN** | **0.7353** | **0.6923** | **0.8245** | **0.6474** | — |

### Warm vs Cold AUC (ML-1M)

| Scenario | MF | TALLRec | CoLLM |
|---|---|---|---|
| Warm | 0.728 | 0.724 | **0.753** |
| Cold | 0.552 | 0.696 | **0.700** |

---

## Project Structure

```
collm-recommender/
├── backend/
│   ├── main.py              # FastAPI app — all models, training, WS, API routes
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # 8-page React app (1550 lines, single file)
│   │   └── index.js
│   ├── public/index.html
│   ├── package.json
│   ├── nginx.conf           # SPA routing + /api/ proxy + gzip
│   └── Dockerfile           # Multi-stage: Node build → nginx serve
├── scripts/
│   ├── download_data.sh     # Auto-download ML-1M + Amazon-Book
│   ├── preprocess.py        # Temporal train/val/test splits
│   └── train.py             # CLI trainer with AUC/UAUC/NDCG metrics
├── data/
│   └── README.md            # Data download instructions
├── .github/
│   └── workflows/deploy.yml # CI: test → build → push GHCR → trigger Render
├── docker-compose.yml       # Local dev (builds from source)
├── docker-compose.prod.yml  # Production (pulls GHCR images)
├── render.yaml              # One-click Render blueprint
├── Makefile                 # All commands in one place
├── .env.example             # Environment variable template
└── README.md
```

---

## Quick Start — Local (3 steps)

### Prerequisites

| Tool | Min version | Install |
|---|---|---|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Git | any | [git-scm.com](https://git-scm.com) |

Docker is optional but makes things simpler.

### Step 1 — Clone

```bash
git clone https://github.com/YOUR_USERNAME/collm-recommender.git
cd collm-recommender
```

### Step 2 — Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend starts at **http://localhost:8000**
Interactive API docs at **http://localhost:8000/docs**

### Step 3 — Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

App opens automatically at **http://localhost:3000**

> **Windows users:** replace `REACT_APP_API_URL=http://localhost:8000 npm start`
> with `set REACT_APP_API_URL=http://localhost:8000 && npm start`

---

## Docker (Recommended — 1 command)

```bash
# Build and start both services
docker compose up --build

# Background mode
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

| Service | URL |
|---|---|
| Frontend (React + nginx) | http://localhost:3000 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Makefile Commands

```bash
make help           # list all commands
make setup          # pip install + npm install
make dev-backend    # uvicorn --reload
make dev-frontend   # npm start
make dev            # both simultaneously
make docker         # docker compose up --build
make test-backend   # Python syntax + smoke tests
make test-frontend  # npm run build
make data           # download ML-1M + Amazon-Book
make preprocess     # temporal splits → data/processed/
make train          # CLI train all 4 models
make clean          # remove __pycache__, build/, node_modules
```

---

## Data Pipeline

### Option A — Automatic (requires wget)

```bash
bash scripts/download_data.sh
```

This downloads both datasets and runs preprocessing automatically.

### Option B — Manual

**ML-1M:**
1. Download from https://files.grouplens.org/datasets/movielens/ml-1m.zip
2. Extract `ratings.dat` → `data/ml-1m/ratings.dat`

**Amazon-Book:**
1. Request access at https://cseweb.ucsd.edu/~jmcauley/datasets.html#amazon_reviews
2. Download `Books.json.gz` → `data/amazon-book/Books.json.gz`

**Preprocess:**

```bash
# Both datasets (default)
python scripts/preprocess.py

# Just ML-1M
python scripts/preprocess.py --dataset ml1m

# Just Amazon-Book
python scripts/preprocess.py --dataset amazon
```

Output goes to `data/processed/` as `ml1m_train.csv`, `ml1m_val.csv`, `ml1m_test.csv`, etc.

**Temporal splits (paper-faithful):**
- ML-1M: most recent 20 months → 10 train / 5 val / 5 test
- Amazon-Book: year 2017 → 11 months train / 0.5 val / 0.5 test

---

## CLI Training

```bash
# Train CoLLM-MF on ML-1M
python scripts/train.py --dataset ml1m --model mf --epochs 10

# Train all 4 models
make train

# With custom hyperparameters
python scripts/train.py \
  --dataset ml1m \
  --model din \
  --epochs 15 \
  --lr 1e-3 \
  --batch_size 64 \
  --embedding_dim 128

# Available models: mf | lightgcn | sasrec | din
# Available datasets: ml1m | amazon
```

Checkpoints saved to `backend/models/collm_{model}_{dataset}.pt`

---

## API Reference

All endpoints are prefixed with `http://localhost:8000`.

### Core

| Method | Path | Description |
|---|---|---|
| GET | `/` | Service info |
| GET | `/health` | Health check (used by Docker + Render) |
| GET | `/stats` | Dataset and model statistics |
| GET | `/docs` | Swagger UI (auto-generated) |

### Recommendations

```bash
# GET — simple
curl "http://localhost:8000/recommend/42?num=5&model=mf"

# POST — full options
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"user_id": 42, "num": 5, "model_type": "din"}'

# POST — batch
curl -X POST http://localhost:8000/recommend/batch \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [1, 2, 3], "num": 5, "model_type": "mf"}'
```

### Training

```bash
# Start training (background task)
curl -X POST http://localhost:8000/training/start \
  -H "Content-Type: application/json" \
  -d '{"collab_type": "mf", "epochs_step1": 5, "epochs_step2": 5, "batch_size": 64}'

# Poll status
curl http://localhost:8000/training/status

# History for a trained model
curl http://localhost:8000/training/history/mf

# WebSocket — live training stream
# Connect: ws://localhost:8000/ws/training
# Messages: {"type":"progress","step":1,"epoch":3,"loss":0.42,"val_auc":0.71,"progress":30.0}
#            {"type":"done","final_auc":0.7295,"step1":[...],"step2":[...]}
```

### Analytics

```bash
curl http://localhost:8000/model/comparison      # all models vs paper numbers
curl http://localhost:8000/model/info            # architecture + hyperparams
curl http://localhost:8000/analytics/warm-cold   # warm vs cold performance
curl http://localhost:8000/analytics/ablation    # Table 4 ablation study
curl http://localhost:8000/analytics/tuning      # Table 5 tuning strategies
curl http://localhost:8000/export/results        # download results as JSON
```

### Users & Items

```bash
curl http://localhost:8000/users/42/history           # user interaction history
curl "http://localhost:8000/items?limit=20&genre=Action"  # browse items
curl http://localhost:8000/items/99                   # single item

# Record interaction
curl -X POST http://localhost:8000/interact \
  -H "Content-Type: application/json" \
  -d '{"user_id": 42, "item_id": 99, "rating": 5}'
```

---

## Deploy to Render (Free)

Render gives both services a free tier with zero config.

### Step 1 — Push to GitHub

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/collm-recommender.git
git add .
git commit -m "feat: initial CoLLM implementation"
git push -u origin main
```

### Step 2 — Deploy Blueprint

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render reads `render.yaml` and creates **two services** automatically:
   - `collm-backend` (Python web service)
   - `collm-frontend` (Static site)
4. Click **Apply** — both deploy in ~3 minutes

### Step 3 — Set environment variable

After the backend deploys, copy its URL (e.g. `https://collm-backend.onrender.com`).

Go to `collm-frontend` service → **Environment** → add:
```
REACT_APP_API_URL = https://collm-backend.onrender.com
```

Then trigger a manual redeploy of the frontend.

> **Note:** Free Render services spin down after 15 min of inactivity and take ~30s to wake. For always-on, upgrade to the Starter plan ($7/mo).

---

## GitHub Actions CI/CD

The pipeline at `.github/workflows/deploy.yml` runs on every push to `main`:

```
push to main
    │
    ├── test-backend   Python syntax check + smoke test (all 4 models)
    ├── test-frontend  npm install + npm run build
    │
    └── build-and-push (only after both tests pass)
            │
            ├── docker build backend → push to ghcr.io/USER/collm-backend:latest
            ├── docker build frontend → push to ghcr.io/USER/collm-frontend:latest
            │
            └── deploy
                    ├── curl RENDER_DEPLOY_HOOK_BACKEND
                    └── curl RENDER_DEPLOY_HOOK_FRONTEND
```

### Required Secrets

Set these in **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to get it |
|---|---|
| `RENDER_DEPLOY_HOOK_BACKEND` | Render → backend service → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Render → frontend service → Settings → Deploy Hook |
| `BACKEND_URL` | Your live backend URL |
| `DEPLOY_URL` | Your live frontend URL |

`GITHUB_TOKEN` is automatically available — no setup needed.

---

## Self-Hosted VPS (Advanced)

```bash
# On your server (Ubuntu 22.04)
git clone https://github.com/YOUR_USERNAME/collm-recommender.git
cd collm-recommender

# Set your backend URL in the frontend build arg
BACKEND_URL=http://YOUR_SERVER_IP:8000

# Run production stack
GITHUB_REPOSITORY=YOUR_USERNAME/collm-recommender \
docker compose -f docker-compose.prod.yml pull && \
docker compose -f docker-compose.prod.yml up -d

# Or build locally
docker compose up --build -d
```

For HTTPS, put nginx or Caddy in front:
```bash
# Caddy (auto-TLS)
caddy reverse-proxy --from collm.yourdomain.com --to localhost:3000
```

---

## Frontend Pages

| Page | Route key | Description |
|---|---|---|
| Dashboard | `dashboard` | Live stats, performance overview, radar chart |
| Recommendations | `recommend` | Per-user recommendation with model selector |
| Architecture | `architecture` | CoLLM model diagram, CIE module, LoRA |
| Training | `training` | Live WebSocket training with loss/AUC charts |
| Performance | `analysis` | Paper Table 2 + warm/cold + ablation + tuning |
| Model Comparison | `compare` | Side-by-side all 10 models, bar charts |
| Datasets | `datasets` | ML-1M vs Amazon-Book stats, distribution |
| Paper Explorer | `explorer` | Key paper figures and findings navigator |

---

## Model Architecture

### CoLLM Full Pipeline

```
Input prompt (text):
  "User liked: Action Movie 5, Drama Movie 12. Target: Sci-Fi Movie 88. Relevant?"

Step 1 — Text encoding (LoRA fine-tuned):
  tokens → Embedding(128) → Linear(256) → Linear(768)
  + LoRA: A(768×8) × B(8×768) × (alpha/r)  ← only LoRA params updated in Step 1

Step 2 — Collaborative encoding (CIE module):
  user_id → ColabModel.get_user_repr() → dim=128
          → MLP(128→512→512→768) → proj(768→768) → eu ∈ R^768

  item_id → ColabModel.get_item_repr() → dim=128
          → same MLP → ei ∈ R^768                 ← CIE params updated in Step 2

Fusion:
  feat = concat(text_repr, eu, ei)  ∈ R^2304

RecHead:
  feat → Linear(2304→1152) → ReLU → Dropout → Linear(1152→1) → sigmoid → p(Yes)
```

### Collaborative Models

| Model | Paper | Key idea |
|---|---|---|
| MF | Koren et al. 2009 | User/item latent factors + biases |
| LightGCN | He et al. SIGIR 2020 | Simplified GCN on interaction graph |
| SASRec | Kang & McAuley ICDM 2018 | Transformer on interaction sequence |
| DIN | Zhou et al. KDD 2018 | Attention over history w.r.t. target item |

---

## Troubleshooting

### Backend won't start

```bash
# Check Python version
python3 --version   # must be ≥ 3.10

# Install PyTorch CPU-only (faster to install, no GPU needed)
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

### Frontend can't reach backend

```bash
# Make sure backend is running first
curl http://localhost:8000/health

# Check REACT_APP_API_URL is set
echo $REACT_APP_API_URL

# In package.json, "proxy" must point to backend
cat frontend/package.json | grep proxy
```

### Docker port conflict

```bash
# Check what's using port 8000 or 3000
lsof -i :8000
lsof -i :3000

# Change ports in docker-compose.yml:
# "8001:8000"  →  backend at localhost:8001
# "3001:80"    →  frontend at localhost:3001
```

### npm install fails

```bash
# Clear cache and retry
npm cache clean --force
rm -rf frontend/node_modules
cd frontend && npm install
```

### Training WebSocket disconnects

The WebSocket at `/ws/training` stays open during training. If it disconnects, the UI automatically shows an "Offline" indicator. Click **Refresh Status** to poll via HTTP instead. The training continues in the background regardless.

---

## Paper Reference

```bibtex
@article{zhang2023collm,
  title   = {CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation},
  author  = {Yang Zhang and Fuli Feng and Jizhi Zhang and Keqin Bao and Qifan Wang and Xiangnan He},
  journal = {arXiv preprint arXiv:2310.19488},
  year    = {2023}
}
```

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
Built as an ML Capstone project · Implements arXiv:2310.19488 · PyTorch + FastAPI + React
</div>
