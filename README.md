# CoLLM v5 — Complete Research Platform

> **Integrating Collaborative Embeddings into Large Language Models for Recommendation**
> Yang Zhang et al. · USTC + Meta AI · [arXiv:2310.19488](https://arxiv.org/abs/2310.19488)

---

## What's New in v5

| Area | Improvement |
|------|-------------|
| 🏠 Landing Page | Animated hero, stats strip, feature grid, tech stack |
| 🎯 Recommendations | Fixed API parsing · confidence rings · genre filter · CSV export |
| 📦 Item Catalog | New page · search · genre filter · sort · pagination · detail modal |
| 📊 Performance | Full Table 2 · ablation · tuning · NDCG@10 · efficiency — all with export |
| 🔄 Training | Epoch-by-epoch animation · live log · export training metrics |
| ⚖️ Model Comparison | Fixed scatter · relative improvement bars · toggle + export |
| 🗃️ Datasets | Pie chart · genre dist · preprocessing pipeline · data download |
| 📡 Backend | ALL endpoints fixed to match frontend · new analytics endpoints |
| 💾 Export | CSV + JSON downloads on every table · catalog + interactions export |
| 🎨 Typography | Inter 900 + JetBrains Mono throughout |

---

## Features

### 9 Full Pages
1. **Dashboard** — 6 stat cards + 4 charts (bar, radar, warm/cold, cold-start)
2. **Recommendations** — Personalized recs with confidence rings + history panel
3. **Item Catalog** — 5,000 items, searchable/filterable/paginated with modal detail
4. **Architecture** — CIE flow diagram + two-step training explanation
5. **Training** — Animated epoch-by-epoch replay + hyperparameter table
6. **Performance** — Table 2 + ablation + tuning + NDCG + efficiency
7. **Model Comparison** — Bar chart + scatter + relative improvement bars
8. **Datasets** — ML-1M + Amazon-Book stats + preprocessing pipeline
9. **Paper Explorer** — Accordion sections covering all paper contributions

### Backend API (FastAPI v5)
```
GET  /stats                    → platform stats (users, items, interactions)
GET  /recommend/{user_id}      → top-N recommendations with confidence scores
GET  /users/{user_id}/history  → interaction history
GET  /users/random             → random user
GET  /items                    → paginated catalog (search, genre, sort)
GET  /items/{item_id}          → item detail
POST /training/start           → run two-step training, returns epoch metrics
GET  /training/history/{model} → past training metrics
GET  /model/comparison         → Table 2 full comparison data
GET  /analytics/warm-cold      → warm vs cold scenario AUC
GET  /analytics/ablation       → Table 4 ablation results
GET  /analytics/tuning         → Table 5 tuning strategy results
GET  /analytics/ndcg           → NDCG@10 full comparison
GET  /analytics/efficiency     → training/inference overhead comparison
GET  /analytics/cold-start     → cold-start robustness curve
GET  /export/csv               → download Table 2 as CSV
GET  /export/json              → download Table 2 as JSON
GET  /export/items             → download catalog sample CSV
GET  /export/interactions      → download interactions sample CSV
WS   /ws/training              → live training updates (WebSocket)
```

---

## Quick Start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

### 2. Frontend
```bash
cd frontend
cp ../.env.example .env
# Edit .env: REACT_APP_API_URL=http://localhost:8000
npm install
npm start
# → http://localhost:3000
```

---

## Deploy (Free Tier)

### Option A — Render.com (Recommended)
1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Select your repo → render.yaml is auto-detected
4. Both backend + frontend deploy automatically

### Option B — Manual
**Backend (Render Web Service)**
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Root: `backend/`

**Frontend (Vercel)**
- Framework: Create React App
- Build: `npm run build`
- Output: `build`
- Env: `REACT_APP_API_URL=<your-backend-url>`

---

## Paper Results (Table 2)

| Model | ML-1M AUC | ML-1M UAUC | Amazon AUC | Amazon UAUC |
|-------|-----------|------------|------------|-------------|
| MF | 0.6482 | 0.6361 | 0.7134 | 0.5565 |
| LightGCN | 0.5959 | 0.6499 | 0.7103 | 0.5639 |
| DIN | 0.7166 | 0.6459 | 0.8163 | 0.6145 |
| TALLRec | 0.7097 | 0.6818 | 0.7375 | 0.5983 |
| **CoLLM-MF** | **0.7295** | **0.6875** | **0.8109** | **0.6225** |
| **CoLLM-DIN** | **0.7353** | **0.6923** | **0.8245** | **0.6474** |

CoLLM-DIN achieves **+15% cold-start improvement** over MF baseline with only **~12% inference overhead**.

---

## Architecture

```
User History (text) ──┐
                      ├──► LLM Tokenizer ──► Text Embeddings ──┐
Target Item (text) ───┘                                        │
                                                                ├──► Vicuna-7B + LoRA ──► Yes/No
CF User Embedding ────► CIE Module (MLP) ──► Collab Embedding ─┤
                                                                │
CF Item Embedding ────► CIE Module (MLP) ──► Collab Embedding ─┘
```

**CIE Module**: `Linear(128→512) → LayerNorm+ReLU → Linear(512→512) → LayerNorm+ReLU → Linear(512→768)`

---

## Citation

```bibtex
@article{zhang2023collm,
  title   = {CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation},
  author  = {Zhang, Yang and Feng, Fuli and Zhang, Jizhi and Bao, Keqin and Wang, Qifan and He, Xiangnan},
  journal = {arXiv preprint arXiv:2310.19488},
  year    = {2023}
}
```
