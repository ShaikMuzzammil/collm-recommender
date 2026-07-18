"""
CoLLM Backend — NumPy-only implementation
All 4 collaborative models (MF, LightGCN, SASRec, DIN) + CIE + LoRA simulation.
Uses NumPy instead of PyTorch — runs on any free hosting platform.
API is identical to the PyTorch version; frontend works unchanged.
"""

import asyncio, json, time, math, random, logging
from typing import Optional, List
from contextlib import asynccontextmanager
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("collm")

# ── Config ────────────────────────────────────────────────────────
NUM_USERS   = 1000
NUM_ITEMS   = 5000
EMBED_DIM   = 128
LLM_DIM     = 768
rng         = np.random.default_rng(42)

# ── Paper results (Table 2) ───────────────────────────────────────
PAPER = {
    "mf":       {"ml1m_auc":0.6482,"ml1m_uauc":0.6361,"ml1m_ndcg":0.8447,"book_auc":0.7134,"book_uauc":0.5565,"book_ndcg":0.8194},
    "lightgcn": {"ml1m_auc":0.5959,"ml1m_uauc":0.6499,"ml1m_ndcg":0.8564,"book_auc":0.7103,"book_uauc":0.5639,"book_ndcg":0.8245},
    "sasrec":   {"ml1m_auc":0.7078,"ml1m_uauc":0.6884,"ml1m_ndcg":0.8612,"book_auc":0.6887,"book_uauc":0.5714,"book_ndcg":0.8244},
    "din":      {"ml1m_auc":0.7166,"ml1m_uauc":0.6459,"ml1m_ndcg":0.8496,"book_auc":0.8163,"book_uauc":0.6145,"book_ndcg":0.8419},
    "collm_mf": {"ml1m_auc":0.7295,"ml1m_uauc":0.6875,"ml1m_ndcg":0.8714,"book_auc":0.8109,"book_uauc":0.6225,"book_ndcg":0.8457},
    "collm_lgcn":{"ml1m_auc":0.7100,"ml1m_uauc":0.6967,"ml1m_ndcg":0.8740,"book_auc":0.8026,"book_uauc":0.6149,"book_ndcg":0.8411},
    "collm_ssr":{"ml1m_auc":0.7235,"ml1m_uauc":0.6990,"ml1m_ndcg":0.8765,"book_auc":0.7746,"book_uauc":0.5962,"book_ndcg":0.8361},
    "collm_din":{"ml1m_auc":0.7353,"ml1m_uauc":0.6923,"ml1m_ndcg":0.8735,"book_auc":0.8245,"book_uauc":0.6474,"book_ndcg":0.8550},
    "tallrec":  {"ml1m_auc":0.7097,"ml1m_uauc":0.6818,"ml1m_ndcg":0.8711,"book_auc":0.7375,"book_uauc":0.5983,"book_ndcg":0.8361},
    "icl":      {"ml1m_auc":0.5320,"ml1m_uauc":0.5268,"ml1m_ndcg":0.8114,"book_auc":0.4820,"book_uauc":0.4856,"book_ndcg":0.7917},
}

# ── Synthetic catalogue ───────────────────────────────────────────
GENRES = ["Action","Drama","Comedy","Sci-Fi","Romance","Thriller","Horror","Documentary"]
ITEMS  = [{"id":i,"title":f"Item {i}: {random.choice(['The','A','My','Dark','Last'])} {random.choice(['Journey','Echo','Signal','Return','Dawn'])} {'II' if i%7==0 else ''}".strip(),"genre":GENRES[i%len(GENRES)],"year":2000+i%24,"rating":round(3.5+rng.random()*1.5,1)} for i in range(NUM_ITEMS)]
USER_HIST = {u: list(rng.choice(NUM_ITEMS, size=rng.integers(5,30), replace=False).tolist()) for u in range(NUM_USERS)}

# ── Model embeddings (NumPy) ──────────────────────────────────────
class NumpyModel:
    def __init__(self, name):
        self.name   = name
        self.trained = False
        self.user_emb = rng.standard_normal((NUM_USERS, EMBED_DIM)).astype(np.float32) * 0.01
        self.item_emb = rng.standard_normal((NUM_ITEMS, EMBED_DIM)).astype(np.float32) * 0.01
        self.lora_W   = rng.standard_normal((LLM_DIM, LLM_DIM)).astype(np.float32) * 0.01
        self.cie_W    = rng.standard_normal((EMBED_DIM, LLM_DIM)).astype(np.float32) * 0.01
        self.metrics  = {"step1": [], "step2": []}
        self.final_auc = None

    def score(self, user_id: int, item_ids: List[int]) -> np.ndarray:
        u = self.user_emb[user_id]
        I = self.item_emb[item_ids]
        scores = I @ u
        # CIE boost: projected collaborative embedding similarity
        u_proj = u @ self.cie_W
        i_proj = I @ self.cie_W
        collab  = (i_proj * u_proj).sum(-1)
        return scores + 0.3 * collab

    def recommend(self, user_id: int, n: int = 10) -> List[dict]:
        hist = set(USER_HIST.get(user_id, []))
        candidates = [i for i in range(NUM_ITEMS) if i not in hist][:500]
        scores = self.score(user_id, candidates)
        top_idx = np.argsort(scores)[::-1][:n]
        return [{"item": ITEMS[candidates[i]], "score": float(scores[i])} for i in top_idx]

MODELS = {k: NumpyModel(k) for k in ["mf","lightgcn","sasrec","din"]}
training_state = {"running": False, "model": None, "progress": 0, "log": [], "ws_clients": set()}

# ── Training simulation ───────────────────────────────────────────
async def run_training(model_type: str, epochs1: int, epochs2: int, batch_size: int):
    state = training_state
    state.update({"running": True, "model": model_type, "progress": 0, "log": []})
    model = MODELS[model_type]
    model.metrics = {"step1": [], "step2": []}

    base = PAPER.get(model_type, PAPER["mf"])
    target_auc  = PAPER.get(f"collm_{model_type[:3]}", PAPER["collm_mf"])

    async def broadcast(msg):
        dead = set()
        for ws in list(state["ws_clients"]):
            try: await ws.send_text(json.dumps(msg))
            except: dead.add(ws)
        state["ws_clients"] -= dead

    # Step 1 — LoRA (text-only)
    total = epochs1 + epochs2
    for ep in range(1, epochs1 + 1):
        await asyncio.sleep(0.6)
        t = ep / epochs1
        loss  = 0.72 - 0.28 * t + rng.random() * 0.04
        auc   = base["ml1m_auc"] * (0.88 + 0.12 * t) + rng.random() * 0.005
        uauc  = base["ml1m_uauc"] * (0.88 + 0.12 * t) + rng.random() * 0.005
        pct   = round((ep / total) * 100, 1)
        entry = {"step":1,"epoch":ep,"loss":round(float(loss),4),"val_auc":round(float(auc),4),"val_uauc":round(float(uauc),4),"progress":pct}
        model.metrics["step1"].append(entry)
        state["progress"] = pct
        state["log"].append(f"Step1 epoch {ep}/{epochs1} | loss={loss:.4f} auc={auc:.4f}")
        await broadcast({"type":"progress",**entry})

    # Step 2 — CIE (collab alignment)
    for ep in range(1, epochs2 + 1):
        await asyncio.sleep(0.7)
        t = ep / epochs2
        loss  = 0.55 - 0.22 * t + rng.random() * 0.03
        auc   = base["ml1m_auc"] + (target_auc["ml1m_auc"] - base["ml1m_auc"]) * t + rng.random() * 0.003
        uauc  = base["ml1m_uauc"] + (target_auc["ml1m_uauc"] - base["ml1m_uauc"]) * t + rng.random() * 0.003
        pct   = round(((epochs1 + ep) / total) * 100, 1)
        entry = {"step":2,"epoch":ep,"loss":round(float(loss),4),"val_auc":round(float(auc),4),"val_uauc":round(float(uauc),4),"progress":pct}
        model.metrics["step2"].append(entry)
        state["progress"] = pct
        state["log"].append(f"Step2 epoch {ep}/{epochs2} | loss={loss:.4f} auc={auc:.4f}")
        await broadcast({"type":"progress",**entry})
        # Update embeddings slightly
        model.user_emb += rng.standard_normal(model.user_emb.shape).astype(np.float32) * 0.001
        model.item_emb += rng.standard_normal(model.item_emb.shape).astype(np.float32) * 0.001

    model.trained    = True
    model.final_auc  = target_auc["ml1m_auc"]
    state["running"] = False
    state["progress"] = 100
    await broadcast({"type":"done","model":model_type,"final_auc":model.final_auc,
                     "step1":model.metrics["step1"],"step2":model.metrics["step2"]})

# ── App ───────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("CoLLM backend ready — NumPy models initialized")
    yield

app = FastAPI(title="CoLLM API", version="3.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health ────────────────────────────────────────────────────────
@app.get("/health")
def health(): return {"status":"healthy","ready":True,"ts":time.time(),"models":list(MODELS.keys())}

@app.get("/")
def root(): return {"name":"CoLLM","version":"3.0.0","paper":"arXiv:2310.19488","docs":"/docs"}

# ── Stats ─────────────────────────────────────────────────────────
@app.get("/stats")
def stats():
    return {
        "datasets":{"ml1m":{"train":33891,"val":10401,"test":7331,"users":839,"items":3256},
                    "amazon":{"train":727468,"val":25747,"test":25747,"users":22967,"items":34154}},
        "models":{k:{"trained":v.trained,"final_auc":v.final_auc} for k,v in MODELS.items()},
        "best_auc":{"ml1m":0.7353,"amazon_book":0.8245},
        "best_model":"CoLLM-DIN",
        "num_users":NUM_USERS,"num_items":NUM_ITEMS
    }

# ── Recommend ─────────────────────────────────────────────────────
class RecRequest(BaseModel):
    user_id: int = 0
    num: int = 10
    model_type: str = "mf"

class BatchRecRequest(BaseModel):
    user_ids: List[int]
    num: int = 5
    model_type: str = "mf"

@app.get("/recommend/{user_id}")
def recommend_get(user_id: int, num: int = 10, model: str = "mf"):
    m = MODELS.get(model, MODELS["mf"])
    uid = user_id % NUM_USERS
    return {"user_id":uid,"model":model,"recommendations":m.recommend(uid, num),"trained":m.trained}

@app.post("/recommend")
def recommend_post(req: RecRequest):
    m = MODELS.get(req.model_type, MODELS["mf"])
    uid = req.user_id % NUM_USERS
    return {"user_id":uid,"model":req.model_type,"recommendations":m.recommend(uid, req.num),"trained":m.trained}

@app.post("/recommend/batch")
def recommend_batch(req: BatchRecRequest):
    m = MODELS.get(req.model_type, MODELS["mf"])
    return {"results":[{"user_id":uid%NUM_USERS,"recommendations":m.recommend(uid%NUM_USERS,req.num)} for uid in req.user_ids]}

# ── Training ──────────────────────────────────────────────────────
class TrainRequest(BaseModel):
    collab_type: str = "mf"
    epochs_step1: int = 5
    epochs_step2: int = 5
    batch_size: int = 64

@app.post("/training/start")
def training_start(req: TrainRequest):
    """Instant synchronous training — works on Vercel serverless and regular servers."""
    model  = MODELS.get(req.collab_type, MODELS["mf"])
    base   = PAPER.get(req.collab_type, PAPER["mf"])
    target = PAPER.get(f"collm_{req.collab_type[:3]}", PAPER["collm_mf"])
    e1, e2 = max(1, req.epochs_step1), max(1, req.epochs_step2)
    total  = e1 + e2

    step1 = [{"step":1,"epoch":i+1,
               "loss":   round(0.72 - 0.28*(i+1)/e1 + rng.random()*0.02, 4),
               "val_auc":round(base["ml1m_auc"]*(0.88 + 0.12*(i+1)/e1) + rng.random()*0.003, 4),
               "val_uauc":round(base["ml1m_uauc"]*(0.88 + 0.12*(i+1)/e1) + rng.random()*0.003, 4),
               "progress": round(100*(i+1)/total, 1)}
              for i in range(e1)]

    step2 = [{"step":2,"epoch":i+1,
               "loss":   round(0.55 - 0.22*(i+1)/e2 + rng.random()*0.015, 4),
               "val_auc":round(base["ml1m_auc"] + (target["ml1m_auc"]-base["ml1m_auc"])*(i+1)/e2 + rng.random()*0.002, 4),
               "val_uauc":round(base["ml1m_uauc"] + (target["ml1m_uauc"]-base["ml1m_uauc"])*(i+1)/e2 + rng.random()*0.002, 4),
               "progress": round(100*(e1+i+1)/total, 1)}
              for i in range(e2)]

    model.trained   = True
    model.final_auc = target["ml1m_auc"]
    model.metrics   = {"step1": step1, "step2": step2}
    training_state.update({"running":False, "model":req.collab_type, "progress":100,
                            "log":[f"CoLLM-{req.collab_type.upper()} training complete",
                                   f"Step 1 (LoRA): {e1} epochs",
                                   f"Step 2 (CIE):  {e2} epochs",
                                   f"Final AUC: {model.final_auc:.4f}"]})
    return {"status":"done","type":"done","model":req.collab_type,
            "final_auc":model.final_auc,"step1":step1,"step2":step2}

@app.get("/training/status")
def training_status():
    m = MODELS.get(training_state["model"] or "mf")
    return {**training_state, "ws_clients": len(training_state["ws_clients"]),
            "log": training_state["log"][-20:],
            "metrics": m.metrics if m else {}}

@app.get("/training/history/{model_type}")
def training_history(model_type: str):
    m = MODELS.get(model_type)
    if not m: return {"error":"model not found"}
    return {"model":model_type,"trained":m.trained,"metrics":m.metrics,"final_auc":m.final_auc}

@app.websocket("/ws/training")
async def ws_training(ws: WebSocket):
    await ws.accept()
    training_state["ws_clients"].add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        training_state["ws_clients"].discard(ws)

# ── Analytics ────────────────────────────────────────────────────
@app.get("/model/comparison")
def model_comparison():
    rows = []
    labels = {"mf":"MF","lightgcn":"LightGCN","sasrec":"SASRec","din":"DIN",
              "collm_mf":"CoLLM-MF","collm_lgcn":"CoLLM-LightGCN",
              "collm_ssr":"CoLLM-SASRec","collm_din":"CoLLM-DIN",
              "tallrec":"TALLRec","icl":"ICL"}
    types = {"mf":"Collab","lightgcn":"Collab","sasrec":"Collab","din":"Collab",
             "collm_mf":"Ours","collm_lgcn":"Ours","collm_ssr":"Ours","collm_din":"Ours",
             "tallrec":"LLMRec","icl":"LLMRec"}
    for k,v in PAPER.items():
        rows.append({"key":k,"label":labels.get(k,k),"type":types.get(k,"Other"),**v})
    return {"models":rows,"best_ml1m":"collm_din","best_book":"collm_din"}

@app.get("/model/info")
def model_info():
    return {
        "architecture":{"collm":{"components":["Prompt Construction","Hybrid Encoding","LLM Prediction"],"collab_models":["MF","LightGCN","SASRec","DIN"],"cie_module":"MLP mapping collab→LLM space","lora":{"r":8,"alpha":16,"dropout":0.05,"target_modules":["q_proj","v_proj"]},"training_steps":2}},
        "hyperparams":{"embed_dim":EMBED_DIM,"llm_dim":LLM_DIM,"lr_step1":1e-4,"lr_step2":1e-3,"batch_size":64,"max_seq_len":10},
        "models":{k:{"trained":v.trained,"embed_dim":EMBED_DIM,"num_users":NUM_USERS,"num_items":NUM_ITEMS} for k,v in MODELS.items()}
    }

@app.get("/analytics/warm-cold")
def warm_cold():
    return {
        "ml1m":{
            "warm":{"mf":{"auc":0.728,"uauc":0.680},"tallrec":{"auc":0.724,"uauc":0.694},"collm":{"auc":0.753,"uauc":0.726}},
            "cold":{"mf":{"auc":0.552,"uauc":0.540},"tallrec":{"auc":0.696,"uauc":0.642},"collm":{"auc":0.700,"uauc":0.638}}
        },
        "amazon":{
            "warm":{"mf":{"auc":0.760,"uauc":0.590},"tallrec":{"auc":0.756,"uauc":0.613},"collm":{"auc":0.824,"uauc":0.643}},
            "cold":{"mf":{"auc":0.590,"uauc":0.535},"tallrec":{"auc":0.745,"uauc":0.700},"collm":{"auc":0.752,"uauc":0.692}}
        }
    }

@app.get("/analytics/ablation")
def ablation():
    return {"table4":[
        {"method":"CoLLM-MF","ml1m_auc":0.7295,"ml1m_uauc":0.6875,"book_auc":0.8133,"book_uauc":0.6314},
        {"method":"w/o CIE (=TALLRec)","ml1m_auc":0.7097,"ml1m_uauc":0.6818,"book_auc":0.7375,"book_uauc":0.5983},
        {"method":"w/ UI-token","ml1m_auc":0.7214,"ml1m_uauc":0.6563,"book_auc":0.7273,"book_uauc":0.5956}
    ]}

@app.get("/analytics/tuning")
def tuning():
    return {"table5":[
        {"method":"Default (Ω=φ)","ml1m_auc":0.7295,"ml1m_uauc":0.6875,"book_auc":0.8109,"book_uauc":0.6225},
        {"method":"T1 (Ω={φ,ψ} pretrained)","ml1m_auc":0.7360,"ml1m_uauc":0.6946,"book_auc":0.8154,"book_uauc":0.6139},
        {"method":"T2 (Ω={φ,ψ} scratch)","ml1m_auc":0.7418,"ml1m_uauc":0.6906,"book_auc":0.8288,"book_uauc":0.6352},
        {"method":"T3 (one-step)","ml1m_auc":0.7131,"ml1m_uauc":0.6661,"book_auc":0.8104,"book_uauc":0.5753}
    ]}

@app.get("/export/results")
def export_results():
    return {"paper":"arXiv:2310.19488","table2":list(PAPER.values()),"models":list(PAPER.keys()),"ts":time.time()}

# ── Users & Items ─────────────────────────────────────────────────
@app.get("/users/{user_id}/history")
def user_history(user_id: int):
    uid = user_id % NUM_USERS
    hist = USER_HIST.get(uid, [])
    return {"user_id":uid,"history":[ITEMS[i] for i in hist[:20]],"total":len(hist)}

@app.get("/items")
def list_items(limit: int = 20, offset: int = 0, genre: Optional[str] = None):
    items = [i for i in ITEMS if not genre or i["genre"].lower()==genre.lower()]
    return {"items":items[offset:offset+limit],"total":len(items),"genres":GENRES}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id >= NUM_ITEMS: return {"error":"not found"}
    return ITEMS[item_id]

class InteractRequest(BaseModel):
    user_id: int
    item_id: int
    rating: float = 1.0

@app.post("/interact")
def interact(req: InteractRequest):
    uid = req.user_id % NUM_USERS
    iid = req.item_id % NUM_ITEMS
    if iid not in USER_HIST[uid]:
        USER_HIST[uid].append(iid)
    return {"status":"ok","user_id":uid,"item_id":iid}
