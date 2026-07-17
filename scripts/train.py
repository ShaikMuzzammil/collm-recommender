#!/usr/bin/env python3
"""
CoLLM — Full Training Script (CLI)
Trains CoLLM on ML-1M or Amazon-Book with all 4 collaborative models.

Usage:
    python scripts/train.py --collab mf --dataset ml1m --epochs1 5 --epochs2 5
    python scripts/train.py --collab din --dataset amazon --epochs1 8 --epochs2 8
    python scripts/train.py --all   # Train all 4 collab models sequentially
"""

import sys, os, argparse, time, json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import torch
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, ndcg_score
from torch.utils.data import DataLoader
import torch.nn as nn

from main import (
    CoLLM, Config, SimpleTokenizer, RecDataset,
    generate_synthetic_data
)


def load_csv_dataset(dataset: str, data_dir: str = "data/processed"):
    """Load preprocessed CSV splits."""
    base = Path(data_dir)
    prefix = "ml1m" if dataset == "ml1m" else "amazon"
    try:
        train = pd.read_csv(base / f"{prefix}_train.csv")
        val   = pd.read_csv(base / f"{prefix}_val.csv")
        test  = pd.read_csv(base / f"{prefix}_test.csv")
        print(f"Loaded {dataset}: train={len(train):,} val={len(val):,} test={len(test):,}")
        return train, val, test
    except FileNotFoundError:
        print(f"⚠️  Processed data not found. Using synthetic data.")
        return None, None, None


def compute_metrics(preds, labels, user_ids):
    """Compute AUC, UAUC, NDCG@10 per the paper."""
    preds, labels, user_ids = np.array(preds), np.array(labels), np.array(user_ids)
    try:
        auc = roc_auc_score(labels, preds)
    except:
        auc = 0.5

    # UAUC — per-user AUC, then average
    user_aucs = []
    for u in np.unique(user_ids):
        mask = user_ids == u
        if labels[mask].sum() == 0 or labels[mask].sum() == mask.sum():
            continue
        try:
            user_aucs.append(roc_auc_score(labels[mask], preds[mask]))
        except: pass
    uauc = np.mean(user_aucs) if user_aucs else 0.0

    # NDCG@10
    try:
        ndcg_vals = []
        for u in np.unique(user_ids):
            mask = user_ids == u
            if labels[mask].sum() == 0:
                continue
            y_true = labels[mask].reshape(1, -1)
            y_score = preds[mask].reshape(1, -1)
            k = min(10, y_true.shape[1])
            ndcg_vals.append(ndcg_score(y_true, y_score, k=k))
        ndcg = np.mean(ndcg_vals) if ndcg_vals else 0.0
    except:
        ndcg = 0.0

    return {"AUC": round(auc, 4), "UAUC": round(uauc, 4), "NDCG@10": round(ndcg, 4)}


def train_collm(
    collab_type: str = "mf",
    dataset: str = "synthetic",
    epochs1: int = 5,
    epochs2: int = 5,
    batch_size: int = 64,
    lr: float = 1e-3,
    save_dir: str = "models",
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n{'='*60}")
    print(f"  CoLLM-{collab_type.upper()} | Dataset: {dataset} | Device: {device}")
    print(f"{'='*60}")

    # Data
    train_df, val_df, test_df = load_csv_dataset(dataset)
    if train_df is None:
        raw_df, user_hist, item_meta = generate_synthetic_data(500, 2000, 10000)
        split1 = int(0.7 * len(raw_df))
        split2 = int(0.85 * len(raw_df))
        train_df = raw_df.iloc[:split1]
        val_df   = raw_df.iloc[split1:split2]
        test_df  = raw_df.iloc[split2:]
    else:
        from collections import defaultdict
        user_hist = defaultdict(list)
        for _, row in train_df[train_df.label == 1].iterrows():
            user_hist[int(row.user_id)].append(int(row.item_id))
        item_meta = {int(i): {"title": f"Item {i}", "genre": "General"} for i in train_df.item_id.unique()}

    # Config
    cfg = Config()
    cfg.num_users  = max(train_df.user_id.max(), val_df.user_id.max(), test_df.user_id.max()) + 1
    cfg.num_items  = max(train_df.item_id.max(), val_df.item_id.max(), test_df.item_id.max()) + 1
    cfg.batch_size = batch_size
    cfg.learning_rate = lr
    cfg.num_epochs_step1 = epochs1
    cfg.num_epochs_step2 = epochs2
    print(f"  Users: {cfg.num_users:,} | Items: {cfg.num_items:,}")

    # Tokenizer
    tok = SimpleTokenizer(max_len=64)
    texts = [f"Target: {item_meta.get(i,{}).get('title', str(i))}" for i in list(item_meta.keys())[:500]]
    tok.build_vocab(texts)

    # Datasets
    train_ds = RecDataset(train_df, user_hist, item_meta, tok)
    val_ds   = RecDataset(val_df,   user_hist, item_meta, tok)
    test_ds  = RecDataset(test_df,  user_hist, item_meta, tok)
    train_dl = DataLoader(train_ds, batch_size=batch_size, shuffle=True,  drop_last=True,  num_workers=0)
    val_dl   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False, drop_last=False, num_workers=0)
    test_dl  = DataLoader(test_ds,  batch_size=batch_size, shuffle=False, drop_last=False, num_workers=0)

    model = CoLLM(cfg, collab_type).to(device)
    criterion = nn.BCEWithLogitsLoss()

    def evaluate(dl, use_collab):
        model.eval()
        all_preds, all_labels, all_users = [], [], []
        with torch.no_grad():
            for batch in dl:
                tk, u, i, lbl, seq, sl, hist, hl = [x.to(device) for x in batch]
                u, i = u.squeeze(), i.squeeze()
                out = model(tk, u, i, use_collab=use_collab,
                            seq=seq, seq_len=sl.squeeze(),
                            hist=hist, hist_len=hl.squeeze())
                all_preds.extend(torch.sigmoid(out).cpu().tolist())
                all_labels.extend(lbl.squeeze().cpu().tolist())
                all_users.extend(u.cpu().tolist())
        return compute_metrics(all_preds, all_labels, all_users)

    results = {"step1": [], "step2": [], "test": {}}

    # ── STEP 1 — LoRA (text-only) ────────────────────────────────
    print(f"\n[Step 1] Training LoRA (text-only) for {epochs1} epochs...")
    opt1 = torch.optim.AdamW(
        [p for n, p in model.named_parameters() if p.requires_grad and 'lora' in n],
        lr=lr, weight_decay=1e-3
    )
    scheduler1 = torch.optim.lr_scheduler.CosineAnnealingLR(opt1, T_max=epochs1)

    for ep in range(epochs1):
        model.train()
        ep_loss, n_batch = 0.0, 0
        t0 = time.time()
        for batch in train_dl:
            tk, u, i, lbl, seq, sl, hist, hl = [x.to(device) for x in batch]
            u, i = u.squeeze(), i.squeeze()
            pred = model(tk, u, i, use_collab=False)
            loss = criterion(pred, lbl.squeeze())
            opt1.zero_grad(); loss.backward(); opt1.step()
            ep_loss += loss.item(); n_batch += 1
        scheduler1.step()
        ep_loss /= max(n_batch, 1)
        metrics = evaluate(val_dl, use_collab=False)
        elapsed = time.time() - t0
        r = {"epoch": ep+1, "loss": round(ep_loss, 4), **metrics, "time_s": round(elapsed, 1)}
        results["step1"].append(r)
        print(f"  Ep {ep+1}/{epochs1} | loss={ep_loss:.4f} | AUC={metrics['AUC']:.4f} | UAUC={metrics['UAUC']:.4f} | {elapsed:.1f}s")

    # ── STEP 2 — CIE module ──────────────────────────────────────
    print(f"\n[Step 2] Training CIE module for {epochs2} epochs...")
    for p in model.parameters(): p.requires_grad = False
    for p in model.cie.parameters():   p.requires_grad = True
    for p in model.collab.parameters(): p.requires_grad = True
    for p in model.rec_head.parameters(): p.requires_grad = True

    opt2 = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=lr, weight_decay=1e-3
    )
    scheduler2 = torch.optim.lr_scheduler.CosineAnnealingLR(opt2, T_max=epochs2)

    for ep in range(epochs2):
        model.train()
        ep_loss, n_batch = 0.0, 0
        t0 = time.time()
        for batch in train_dl:
            tk, u, i, lbl, seq, sl, hist, hl = [x.to(device) for x in batch]
            u, i = u.squeeze(), i.squeeze()
            pred = model(tk, u, i, use_collab=True,
                         seq=seq, seq_len=sl.squeeze(),
                         hist=hist, hist_len=hl.squeeze())
            loss = criterion(pred, lbl.squeeze())
            opt2.zero_grad(); loss.backward(); opt2.step()
            ep_loss += loss.item(); n_batch += 1
        scheduler2.step()
        ep_loss /= max(n_batch, 1)
        metrics = evaluate(val_dl, use_collab=True)
        elapsed = time.time() - t0
        r = {"epoch": ep+1, "loss": round(ep_loss, 4), **metrics, "time_s": round(elapsed, 1)}
        results["step2"].append(r)
        print(f"  Ep {ep+1}/{epochs2} | loss={ep_loss:.4f} | AUC={metrics['AUC']:.4f} | UAUC={metrics['UAUC']:.4f} | {elapsed:.1f}s")

    # ── Final evaluation ─────────────────────────────────────────
    print(f"\n[Eval] Running on test set...")
    test_metrics = evaluate(test_dl, use_collab=True)
    results["test"] = test_metrics
    print(f"\n  ✅ Test Results — AUC={test_metrics['AUC']:.4f} | UAUC={test_metrics['UAUC']:.4f} | NDCG@10={test_metrics['NDCG@10']:.4f}")

    # Save model
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)
    model_path = save_path / f"collm_{collab_type}_{dataset}.pt"
    torch.save({"model_state": model.state_dict(),
                "cfg": cfg.__dict__,
                "collab_type": collab_type,
                "results": results}, model_path)
    print(f"  💾 Model saved to {model_path}")

    # Save results
    res_path = save_path / f"results_{collab_type}_{dataset}.json"
    with open(res_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"  📊 Results saved to {res_path}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Train CoLLM")
    parser.add_argument("--collab",   default="mf", choices=["mf","lightgcn","sasrec","din"])
    parser.add_argument("--dataset",  default="synthetic", choices=["synthetic","ml1m","amazon"])
    parser.add_argument("--epochs1",  type=int, default=5)
    parser.add_argument("--epochs2",  type=int, default=5)
    parser.add_argument("--batch",    type=int, default=64)
    parser.add_argument("--lr",       type=float, default=1e-3)
    parser.add_argument("--save_dir", default="models")
    parser.add_argument("--all",      action="store_true", help="Train all 4 collab models")
    args = parser.parse_args()

    collab_models = ["mf","lightgcn","sasrec","din"] if args.all else [args.collab]
    all_results = {}
    for cm in collab_models:
        res = train_collm(cm, args.dataset, args.epochs1, args.epochs2,
                          args.batch, args.lr, args.save_dir)
        all_results[f"CoLLM-{cm.upper()}"] = res["test"]

    if len(collab_models) > 1:
        print(f"\n{'='*60}")
        print("  📊 Final Test Results Summary")
        print(f"{'='*60}")
        for model_name, metrics in all_results.items():
            print(f"  {model_name:20s}: AUC={metrics['AUC']:.4f} | UAUC={metrics['UAUC']:.4f} | NDCG={metrics['NDCG@10']:.4f}")

if __name__ == "__main__":
    main()
