# 🧠 CoLLM Research Platform

**Full-stack interactive research platform** for the [CoLLM paper](https://arxiv.org/abs/2310.19488) — *Integrating Collaborative Embeddings into Large Language Models for Recommendation*.

🚀 **Live Demo**: [https://collm-recommender.vercel.app](https://collm-recommender.vercel.app)

---

## ✨ Features

| Category | Features |
|----------|----------|
| **Auth** | Sign up / Sign in (unified layout) · Google OAuth · JWT sessions · bcrypt passwords |
| **Training** | Live simulation pipeline · Real-time loss/AUC charts · 3-step progress · Job history · JSON export |
| **Evaluation** | AUC · UAUC · NDCG · Warm/Cold splits · Bar + Radar charts · JSON/CSV export |
| **Inference** | Movie recommendation demo · Score breakdown (collaborative + semantic) · Top-5 results · JSON export |
| **Analytics** | 6-tab dashboard: comparison · warm/cold · training curves · ablation · efficiency scatter · usage pie |
| **Datasets** | ML-1M + Amazon-Book full stats · preprocessing pipeline · download links · paper references |
| **Workspace** | Drag-drop upload · category filter · download/copy/delete · description/tag editing |
| **Exports** | PDF (professional stamp) · JSON · CSV · Email HTML report (via Resend) · auto-naming |
| **Guide** | Comprehensive in-app guide: what is CoLLM, architecture, metrics glossary, feature guide, FAQ |
| **Architecture** | Interactive pipeline diagram · CIE module detail · 5-step training animation |

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/ShaikMuzzammil/collm-recommender
cd collm-recommender
npm install --legacy-peer-deps

# 2. Set environment variables
cp .env.example .env
# Edit .env with your values (see below)

# 3. Push DB schema + seed demo user
npm run db:push
npm run db:seed

# 4. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Demo account: `demo@collm.app` / `collm2024!`

---

## 🌍 Environment Variables

Create `.env` (locally) or set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | [neon.tech](https://neon.tech) → New Project → Connection String |
| `NEXTAUTH_URL` | ✅ Yes | Your app URL | `http://localhost:3000` locally; `https://yourapp.vercel.app` on Vercel |
| `NEXTAUTH_SECRET` | ✅ Yes | Random secret for JWT | Run `openssl rand -base64 32` |
| `RESEND_API_KEY` | ⚠️ Email only | For email report delivery | [resend.com](https://resend.com) → API Keys (3,000 free/month) |
| `RESEND_FROM_EMAIL` | ⚠️ Email only | From address for emails | `CoLLM Platform <reports@yourdomain.com>` |
| `GOOGLE_CLIENT_ID` | ⚠️ OAuth only | Google OAuth client ID | [console.cloud.google.com](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | ⚠️ OAuth only | Google OAuth secret | Same as above |

### `.env.example`
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="CoLLM Platform <reports@collm.app>"
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
```

> **Note**: All features (training, evaluation, inference, workspace, exports) work without any API keys. Only email delivery requires RESEND_API_KEY.

---

## ☁️ Deploy to Vercel (Free)

```bash
# 1. Push to GitHub
git add . && git commit -m "Initial deploy" && git push

# 2. Import project on Vercel
# → vercel.com → New Project → Import from GitHub

# 3. Set Environment Variables in Vercel dashboard
# (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, optional: RESEND_API_KEY)

# 4. Deploy — Vercel auto-detects Next.js
```

See [DEPLOY.md](./DEPLOY.md) for full step-by-step deployment guide.

---

## 🗂️ Project Structure

```
collm-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main shell (sidebar + sections)
│   │   ├── sign-in/page.tsx      # Unified sign-in (split layout)
│   │   ├── sign-up/page.tsx      # Unified sign-up (split layout)
│   │   └── api/
│   │       ├── auth/             # NextAuth
│   │       ├── training/         # Training jobs (sim + DB)
│   │       ├── evaluation/       # Evaluation (sim + DB)
│   │       ├── workspace/        # File management
│   │       ├── email/            # Email via Resend
│   │       ├── exports/          # Export records
│   │       └── contact/          # Contact form
│   ├── components/collm/
│   │   ├── DashboardSection.tsx
│   │   ├── ArchitectureSection.tsx
│   │   ├── ModelsSection.tsx
│   │   ├── TrainingSection.tsx   ✅ Fixed — client-side sim
│   │   ├── EvaluationSection.tsx ✅ Fixed — shows results
│   │   ├── ExperimentsSection.tsx
│   │   ├── RecommendSection.tsx  ✅ Fixed — export added
│   │   ├── AnalyticsSection.tsx  ✅ Fixed — all charts work
│   │   ├── DatasetsSection.tsx   ✅ Fixed — links added
│   │   ├── WorkspaceSection.tsx  ✅ Fixed — client-side upload
│   │   ├── ExportSection.tsx     ✅ Fixed — naming + email fix
│   │   ├── GuideSection.tsx      🆕 New comprehensive guide
│   │   ├── ApiDocsSection.tsx
│   │   └── ContactSection.tsx
│   ├── lib/
│   │   ├── auth.ts               # NextAuth config
│   │   ├── db.ts                 # Prisma client
│   │   ├── email.ts              # Resend integration
│   │   ├── pdf.ts                # jsPDF report generator
│   │   ├── store.ts              # Zustand state
│   │   └── data.ts               # Static ML data
│   └── types/
├── prisma/
│   ├── schema.prisma             # 10 models
│   └── seed.ts                   # Demo user seed
├── public/
├── README.md
├── DEPLOY.md
├── .env.example
├── .npmrc
├── vercel.json
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS v3 · shadcn/ui · Framer Motion |
| Charts | Recharts 3 |
| Auth | NextAuth v4 · bcryptjs |
| Database | Prisma ORM · Neon PostgreSQL (serverless) |
| PDF | jsPDF · jspdf-autotable |
| Email | Resend |
| State | Zustand + persist |
| Deployment | Vercel (Edge-compatible) |

---

## 📊 CoLLM Paper Results

Paper: [arXiv:2310.19488v3](https://arxiv.org/abs/2310.19488) — SIGIR 2024

| Model | ML-1M AUC | ML-1M UAUC | ML-1M NDCG | Amazon AUC |
|-------|-----------|------------|------------|------------|
| **CoLLM-DIN** | **0.7353** | **0.6923** | **0.8735** | **0.8245** |
| CoLLM-SASRec | 0.7235 | 0.6990 | 0.8765 | 0.7890 |
| CoLLM-MF | 0.7295 | 0.6875 | 0.8714 | 0.8109 |
| CoLLM-LightGCN | 0.7100 | 0.6967 | 0.8740 | 0.8026 |
| TALLRec (baseline) | 0.7097 | 0.6818 | 0.8711 | 0.7375 |
| MF (baseline) | 0.6482 | 0.6361 | 0.8447 | 0.7134 |

---

## 📜 License

MIT — see [LICENSE](./LICENSE)

Based on [CoLLM paper](https://arxiv.org/abs/2310.19488) by Zhuang Liu et al. (USTC/MIT).
