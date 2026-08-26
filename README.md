<div align="center">

# 🧠 CoLLM Research Platform

**Full-stack production platform for Collaborative LLM Recommendation Research**

Based on: *CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation*
[arXiv:2310.19488v3](https://arxiv.org/abs/2310.19488) · Yang Zhang, Fuli Feng, et al. · USTC / Meta AI

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fcollm-platform)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://prisma.io)

</div>

---

## ✨ Features

### 🤖 ML Research
- **Training Pipeline** — 3-step CoLLM training (Collab Pre-train → LoRA Text Tuning → CIE Module) with live progress charts
- **Real-time Metrics** — Live loss curves, AUC tracking, validation monitoring
- **Model Evaluation** — AUC / UAUC / NDCG metrics across warm & cold scenarios with radar charts
- **Ablation Studies** — CIE module, UI-token, and tuning strategy comparisons
- **4 Collaborative Models** — MF, LightGCN, SASRec, DIN — all pluggable into CoLLM

### 📊 Analytics & Visualization
- **Analytics Dashboard** — Usage patterns, time-series recommendations, model usage pie charts
- **Warm vs Cold Comparison** — Side-by-side bar charts across ML-1M and Amazon-Book
- **Embedding Space** — Architecture diagrams with interactive exploration
- **Efficiency Analysis** — Training/inference overhead vs TALLRec baseline

### 📄 Reports & Exports
- **Professional PDF Reports** — Custom CoLLM header, verification stamp, all metrics tables, methodology section
- **JSON Export** — Full machine-readable data with paper metadata
- **CSV Export** — Spreadsheet-compatible model comparison tables
- **Email Delivery** — Beautiful HTML email reports via Resend API (free 3K/month)
- **Export History** — Track all exports per user session

### 🔐 Authentication & Users
- **Email/Password Auth** — Secure bcrypt hashing via NextAuth.js
- **Google OAuth** — One-click Google sign-in
- **Per-user Workspace** — Personal file storage, job history, evaluation records
- **JWT Sessions** — Stateless, Vercel-compatible

### 💾 Workspace
- **File Manager** — Upload, browse, download, delete files with drag & drop
- **Category Filtering** — dataset / model / report / code / general
- **Copy URLs** — One-click URL copy for any uploaded file
- **Storage Stats** — File count and total size tracking

### 🛠️ Developer
- **Full REST API** — All features exposed via API routes
- **API Documentation** — Interactive API reference built into the app
- **TypeScript** — End-to-end type safety with Zod validation
- **Contact Form** — Email acknowledgment with Resend

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm
- [Neon](https://neon.tech) account (free PostgreSQL)
- [Resend](https://resend.com) account (free email, optional)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/collm-platform.git
cd collm-platform
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://..."       # From Neon dashboard
DIRECT_URL="postgresql://..."         # Neon direct connection
NEXTAUTH_SECRET="..."                 # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."              # From resend.com (optional)
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Neon
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:** `demo@collm.app` / `collm2024!`

---

## 🌐 Deploy to Vercel (Free)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "feat: CoLLM Platform v1.0"
git remote add origin https://github.com/your-username/collm-platform.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add environment variables (see below)
4. Deploy!

### 3. Required Environment Variables on Vercel

| Variable | Value | Where to get |
|----------|-------|-------------|
| `DATABASE_URL` | Neon pooled connection | [neon.tech](https://neon.tech) |
| `DIRECT_URL` | Neon direct connection | [neon.tech](https://neon.tech) |
| `NEXTAUTH_SECRET` | Random 32+ char string | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel URL |
| `RESEND_API_KEY` | `re_xxxxx` | [resend.com](https://resend.com) |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` | Your verified domain |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | [console.cloud.google.com](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | [console.cloud.google.com](https://console.cloud.google.com) |

### 4. Run Migrations on Vercel

After deployment, run from Vercel CLI or in a Neon SQL editor:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 + shadcn/ui |
| **Database** | Neon PostgreSQL (serverless) |
| **ORM** | Prisma 6 |
| **Auth** | NextAuth.js v4 (JWT) |
| **Email** | Resend API |
| **PDF** | jsPDF + jspdf-autotable |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **State** | Zustand (persisted) |
| **Forms** | React Hook Form + Zod |
| **Data Fetching** | TanStack Query |

---

## 📁 Project Structure

```
collm-platform/
├── prisma/
│   ├── schema.prisma          # Full DB schema (User, TrainingJob, Evaluation…)
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth handler
│   │   │   ├── register/      # User registration
│   │   │   ├── recommendations/  # Inference API
│   │   │   ├── training/      # Training job simulation
│   │   │   ├── evaluation/    # Evaluation runner
│   │   │   ├── analytics/     # Dashboard metrics
│   │   │   ├── workspace/     # File management
│   │   │   ├── exports/       # Export logging
│   │   │   ├── email/         # Resend email sender
│   │   │   └── contact/       # Contact form
│   │   ├── sign-in/           # Auth pages
│   │   ├── sign-up/
│   │   ├── globals.css
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Main app with sidebar
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── providers/         # Theme, Session, Query
│   │   └── collm/             # All feature sections
│   │       ├── DashboardSection.tsx
│   │       ├── TrainingSection.tsx    ← Live training pipeline
│   │       ├── EvaluationSection.tsx  ← AUC/UAUC/NDCG
│   │       ├── AnalyticsSection.tsx   ← Charts & insights
│   │       ├── WorkspaceSection.tsx   ← File manager
│   │       ├── ExportSection.tsx      ← PDF + JSON + email
│   │       ├── ContactSection.tsx     ← Contact form
│   │       ├── ArchitectureSection.tsx
│   │       ├── ModelsSection.tsx
│   │       ├── ExperimentsSection.tsx
│   │       ├── RecommendSection.tsx
│   │       ├── DatasetsSection.tsx
│   │       └── ApiDocsSection.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth options
│   │   ├── db.ts              # Prisma client
│   │   ├── email.ts           # Resend templates
│   │   ├── pdf.ts             # PDF generation engine
│   │   ├── store.ts           # Zustand state
│   │   └── utils.ts           # Utilities
│   └── types/
│       └── next-auth.d.ts     # Session type extensions
├── .env.example               # All required env vars documented
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
└── README.md                  # This file
```

---

## 🔑 Free Services Used

| Service | Plan | Limit | Use |
|---------|------|-------|-----|
| [Neon](https://neon.tech) | Free | 0.5 GB storage | PostgreSQL database |
| [Vercel](https://vercel.com) | Hobby | Unlimited deploys | Hosting |
| [Resend](https://resend.com) | Free | 3,000 emails/mo | Email reports |
| [Google OAuth](https://console.cloud.google.com) | Free | Unlimited | Social login |

---

## 📋 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:seed      # Seed demo data
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📜 Citation

```bibtex
@article{zhang2023collm,
  title={CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation},
  author={Zhang, Yang and Feng, Fuli and Zhang, Jizhi and Bao, Keqin and Wang, Qifan and He, Xiangnan},
  journal={arXiv preprint arXiv:2310.19488},
  year={2023}
}
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ for the CoLLM research community · <a href="https://github.com/zyang1580/CoLLM">Original Paper Repo</a>
</div>
