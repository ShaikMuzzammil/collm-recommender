# CoLLM Research Platform v2.0 — Deploy Guide

## Quick Deploy (< 10 min)

### 1. Push to GitHub
```bash
cd collm-v2
git init
git add .
git commit -m "feat: CoLLM Research Platform v2.0"
git remote add origin https://github.com/ShaikMuzzammil/collm-recommender.git
git push -f origin main
```

### 2. Create Vercel Postgres
- Go to: Vercel Dashboard → Your Project → **Storage** tab
- Click **Create Database** → **Postgres** → name it `collm-db`
- Copy `DATABASE_URL` and `DIRECT_URL` from **Settings** tab inside the DB

### 3. Set Environment Variables
Vercel Dashboard → Project → **Settings → Environment Variables**

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | from Vercel Postgres | ✅ Yes |
| `DIRECT_URL` | from Vercel Postgres | ✅ Yes |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | ✅ Yes |
| `NEXTAUTH_URL` | `https://collm-recommender.vercel.app` | ✅ Yes |
| `EMAIL_USER` | `collm.platform@gmail.com` | Optional (email features) |
| `EMAIL_PASS` | Google App Password (16 chars, no spaces) | Optional (email features) |

### 4. Redeploy
After adding env vars, click **Redeploy** in Vercel → Deployments.

### 5. Push DB Schema
After first successful deploy:
```bash
# Option A: Using Vercel CLI
vercel env pull .env.local
npx prisma db push

# Option B: Via Neon Dashboard
# Go to Vercel Postgres → Open in Neon → SQL Editor → run the schema
```

---

## Gmail SMTP Setup (Free Email, No Domain)

### Step 1 — Create Gmail Account
Create a dedicated account: `collm.platform@gmail.com`
*(Don't use your personal Gmail — this account sends automated emails)*

### Step 2 — Enable 2-Step Verification
`myaccount.google.com` → **Security** → **2-Step Verification** → Turn On

### Step 3 — Create App Password
`myaccount.google.com/apppasswords` → App name: **CoLLM Platform**

Google gives you: `abcd efgh ijkl mnop`
**Remove spaces**: `abcdefghijklmnop`

### Step 4 — Add to Vercel
```
EMAIL_USER = collm.platform@gmail.com
EMAIL_PASS = abcdefghijklmnop
```

### Step 5 — Redeploy
Done! Email now works for:
- ✅ Report delivery (to any email address)
- ✅ Contact form acknowledgments
- ✅ Branded HTML template with metrics table

---

## Export Features

### PDF (8 Pages)
| Page | Content |
|------|---------|
| 1 | Cover page with official stamp, pipeline preview |
| 2 | Table of contents |
| 3 | Executive summary + key metrics (3 main + full breakdown table) |
| 4 | All 12 models comparison + warm/cold breakdown |
| 5 | Ablation study + 5-step training pipeline + config |
| 6 | Detailed methodology (architecture, CIE, LoRA, eval protocol) |
| 7 | Efficiency analysis + cold-start improvement |
| 8 | Conclusions (5 findings) + references |

### JSON (11 sections)
```
reportInfo, selectedModel, dataset, metrics, warmColdAnalysis,
allModelsComparison, ablationStudy, hyperparameterTuning,
efficiencyMetrics, evaluationProtocol, paperReference
```

### CSV (6 sections)
```
§1 Selected Model × 3 scenarios
§2 All 12 Models — Overall AUC/UAUC/NDCG
§3 Warm/Cold Breakdown
§4 Ablation Study + ΔStat + impact level
§5 Hyperparameter Tuning
§6 Efficiency Metrics
```

### Email
- Sends formatted HTML report via Gmail SMTP
- Includes: metrics table, warm/cold analysis, model comparison
- Subject: `📊 CoLLM Evaluation Report — [Model] on [Dataset]`

---

## Troubleshooting

### "Registration failed" error
1. `DATABASE_URL` not set → add to Vercel env vars
2. Database not migrated → run `npx prisma db push`
3. Email already exists → use sign-in instead

### Email sends but not received
1. Check spam folder
2. Verify App Password has no spaces
3. Check `EMAIL_USER` is the full Gmail address
4. Try: Vercel Function Logs → your `/api/email` endpoint

### Build fails on Vercel
- Both `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` are set to `true`
- Should never fail due to lint/type errors
- If it does fail, check Vercel build logs for the exact import error

### PDF is only 1 page
- This means `generateFullCoLLMReport` wasn't called (only `generateCoLLMReport`)
- Check ExportSection.tsx imports — ensure it imports from `@/lib/pdf`
