# CoLLM Export Guide — PDF, JSON, CSV, Email

## PDF Export — 8-Page Full Research Report

### What It Contains
| Page | Section | Details |
|------|---------|---------|
| 1 | Cover Page | Logo, model/dataset info, official stamp (ID + date), pipeline preview boxes |
| 2 | Table of Contents | All 13 sub-sections with page numbers, dot leaders |
| 3 | Executive Summary | Summary paragraph, 3 main metric cards, full 3-row breakdown table |
| 4 | Model Comparison | All 12 methods (CF + LLM + CoLLM), warm/cold split table |
| 5 | Ablation + Pipeline | Component ablation with ΔStat, 5-step pipeline diagram, training config |
| 6 | Methodology | Architecture, CIE module, two-step training, LoRA config, eval protocol |
| 7 | Efficiency | Compute costs table, training time vs AUC scatter, cold-start analysis |
| 8 | Conclusions | 5 key findings, 5 references, confidentiality notice + Report ID |

### How to Generate
1. Go to **Export** section
2. Select **Dataset** (MovieLens-1M or Amazon-Book)
3. Select **Model** (CoLLM-DIN, CoLLM-MF, etc.)
4. Optionally set a filename prefix
5. Click **Download PDF**

### Output File
```
filename: collm-lightgcn-ml1m-2025-01-15.pdf  (or your prefix)
pages:    8 (may be 9–10 if methodology section overflows)
format:   A4 portrait, dark theme
```

---

## JSON Export — Complete Data Package

### Structure (11 top-level sections)
```jsonc
{
  "reportInfo": {
    "title": "CoLLM Research Platform — Full Evaluation Export",
    "generatedAt": "2025-01-15T10:30:00Z",
    "generatedBy": "Muzzammil",
    "platform": "CoLLM Research Platform v2.0",
    "reportId": "CR-LX7K2M",
    "paperRef": "arXiv:2310.19488v3"
  },
  "selectedModel": {
    "id": "collm-lightgcn",
    "label": "CoLLM-LightGCN",
    "llmBackbone": "Vicuna-7B",
    "loraConfig": { "rank": 8, "alpha": 16, "dropout": 0.05 },
    "collabDim": 64
  },
  "dataset": {
    "id": "ml-1m",
    "label": "MovieLens-1M",
    "description": "6040 users, 3706 items, 1,000,209 interactions"
  },
  "metrics": {
    "overall": { "auc": 0.8245, "uauc": 0.6474, "ndcg": 0.8550 },
    "warm":    { "auc": 0.8510, "uauc": 0.7100, "ndcg": 0.8800 },
    "cold":    { "auc": 0.7750, "uauc": 0.5600, "ndcg": 0.8050 }
  },
  "warmColdAnalysis": {
    "warm":        { "auc": 0.8423, "uauc": 0.6987, "ndcg": 0.8712 },
    "cold":        { "auc": 0.7612, "uauc": 0.5432, "ndcg": 0.7890 },
    "improvement": { "auc": "+10.6%", "uauc": "+28.7%", "ndcg": "+10.4%" }
  },
  "allModelsComparison": [
    { "method": "MF",               "auc": 0.7911, "uauc": 0.6079, "ndcg": 0.8307, "type": "CF",    "isBest": false },
    { "method": "LightGCN",         "auc": 0.8099, "uauc": 0.6281, "ndcg": 0.8432, "type": "CF",    "isBest": false },
    // ... 10 more methods
    { "method": "CoLLM (LightGCN)", "auc": 0.8245, "uauc": 0.6474, "ndcg": 0.8550, "type": "CoLLM", "isBest": true }
  ],
  "ablationStudy": [
    { "variant": "CoLLM (Full)",             "auc": 0.8245, "deltaAuc": 0,       "impact": "baseline" },
    { "variant": "w/o Collaborative Embedding","auc": 0.6053, "deltaAuc": -0.2192, "impact": "critical" },
    // ... 4 more variants
  ],
  "hyperparameterTuning": [ ... ],
  "efficiencyMetrics": [ ... ],
  "evaluationProtocol": {
    "split": "leave-one-out",
    "coldUserCutoff": "≤10 interactions",
    "metrics": ["AUC", "UAUC", "NDCG@10"],
    "significance": "Paired t-test, p<0.05, averaged over 5 random seeds"
  },
  "paperReference": {
    "title": "CoLLM: Integrating Collaborative Embeddings into LLMs for Recommendation",
    "arxiv": "2310.19488v3",
    "authors": "Yang et al.",
    "affiliation": "USTC / MIT",
    "year": 2024
  }
}
```

### Using in Python
```python
import json
with open("collm-export.json") as f:
    data = json.load(f)

# Get best model AUC
best = max(data["allModelsComparison"], key=lambda x: x["auc"])
print(f"Best: {best['method']} — AUC {best['auc']}")

# Cold-start metrics
cold = data["metrics"]["cold"]
print(f"Cold AUC: {cold['auc']}, UAUC: {cold['uauc']}")
```

---

## CSV Export — 6-Section Spreadsheet

### File Structure
```csv
# CoLLM Research Platform — Full Results Export
# Generated: 2025-01-15T10:30:00Z
# Dataset: MovieLens-1M | Selected Model: CoLLM-LightGCN

## SECTION 1: SELECTED MODEL — ALL SCENARIOS
Model,Dataset,Scenario,AUC,UAUC,NDCG,Is_CoLLM,Is_Best
CoLLM-LightGCN,MovieLens-1M,Overall,0.8245,0.6474,0.8550,true,false
CoLLM-LightGCN,MovieLens-1M,Warm (>10 interactions),0.8510,0.7100,0.8800,true,false
CoLLM-LightGCN,MovieLens-1M,Cold (<=10 interactions),0.7750,0.5600,0.8050,true,false

## SECTION 2: ALL MODELS COMPARISON (OVERALL)
Method,AUC,UAUC,NDCG,Type,Is_CoLLM,Is_Best
MF,0.7911,0.6079,0.8307,CF,false,false
LightGCN,0.8099,0.6281,0.8432,CF,false,false
... (12 methods total)

## SECTION 3: WARM/COLD START BREAKDOWN
Scenario,AUC,UAUC,NDCG
Overall,0.8245,0.6474,0.8550
Warm (>10 interactions),0.8423,0.6987,0.8712
Cold (<=10 interactions),0.7612,0.5432,0.7890
Improvement vs MF,+10.6%,+28.7%,+10.4%

## SECTION 4: ABLATION STUDY
Variant,AUC,UAUC,NDCG,Delta_AUC,Impact
CoLLM (Full),0.8245,0.6474,0.8550,0.0000,baseline
w/o Collaborative Embedding,0.6053,0.5132,0.6912,-0.2192,critical
...

## SECTION 5: HYPERPARAMETER TUNING
Strategy,AUC,UAUC,NDCG,Description
Default,0.8012,0.6178,0.8334,Standard LoRA hyperparameters
...

## SECTION 6: EFFICIENCY METRICS
Method,Train_Time,Infer_Time_ms,Params,Peak_Memory_GB
MF,12 min,2.1 ms,1.2M,0.8 GB
...
```

### Using in Excel / Google Sheets
1. Open Excel → Data → From Text/CSV
2. Select your .csv file
3. Delimiter: Comma
4. Header rows: Skip lines starting with `#` (they're comments)
5. Each `## SECTION` marker is a visual separator — filter by column `Method` to isolate sections

### Using in pandas
```python
import pandas as pd
import io

with open("collm-export.csv") as f:
    lines = f.readlines()

# Skip comment lines (starting with #)
data_lines = [l for l in lines if not l.startswith("#")]

# Find section starts
sections = {}
current_section = None
section_data = []

for line in data_lines:
    if line.startswith("## SECTION"):
        if current_section and section_data:
            sections[current_section] = pd.read_csv(io.StringIO("".join(section_data)))
        current_section = line.strip().replace("## ", "")
        section_data = []
    elif line.strip():
        section_data.append(line)

# Use section 2: All Models
df = sections.get("SECTION 2: ALL MODELS COMPARISON (OVERALL)")
print(df.sort_values("AUC", ascending=False))
```

---

## Email Report

### What Gets Sent
- **To**: Any email address
- **From**: `CoLLM Research Platform <your-gmail@gmail.com>`
- **Subject**: `📊 CoLLM Evaluation Report — [Model] on [Dataset]`

### Sections You Can Toggle
| Section | Default | Description |
|---------|---------|-------------|
| Key Metrics Table | ✅ On | AUC/UAUC/NDCG for all 3 scenarios |
| Warm/Cold Analysis | ✅ On | Side-by-side warm vs cold table |
| Model Comparison | ✅ On | Top 8 methods ranked by AUC |
| Ablation Study | ❌ Off (coming) | Component contribution breakdown |

### Requirements
- `EMAIL_USER` and `EMAIL_PASS` set in Vercel env vars
- See `EMAIL_SETUP.md` for full Gmail SMTP setup guide
