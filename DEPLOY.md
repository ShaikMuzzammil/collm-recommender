# 🚀 CoLLM Platform — Complete Deployment Guide

## Option A: Vercel + Neon (Recommended — Fully Free)

### Step 1: Set Up Neon Database (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech) → **Start Free**
2. Create a new project: `collm-platform`
3. Go to **Dashboard** → **Connection Details**
4. Copy the **Connection String** (looks like `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`)
5. Save this as your `DATABASE_URL`

### Step 2: Push to GitHub

```bash
cd collm-platform
git init
git add .
git commit -m "feat: CoLLM Research Platform v2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/collm-recommender.git
git push -u origin main
```

### Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import from GitHub → select `collm-recommender`
3. Framework: **Next.js** (auto-detected)
4. Click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_URL` | `https://your-project-name.vercel.app` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste result |

5. Click **Deploy** → Wait ~2 minutes

### Step 4: Initialize Database

After first deploy, run in Vercel terminal or locally:

```bash
# Locally (with DATABASE_URL in .env):
npm run db:push
npm run db:seed

# Or via Vercel CLI:
vercel env pull .env.local
npm run db:push
npm run db:seed
```

---

## Adding Optional Features

### Email Reports (Free — 3,000/month)

1. Go to [resend.com](https://resend.com) → **Get Started**
2. Verify your domain (or use `onboarding@resend.dev` for testing)
3. Create API Key → copy it
4. In Vercel → Project Settings → Environment Variables:
   - `RESEND_API_KEY` = `re_xxxxxxxxxx`
   - `RESEND_FROM_EMAIL` = `CoLLM Platform <reports@yourdomain.com>`
5. Redeploy

### Google OAuth (Free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → APIs & Services → Credentials → OAuth 2.0 Client IDs
3. Application type: **Web application**
4. Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
5. Copy Client ID and Client Secret
6. Add to Vercel env vars:
   - `GOOGLE_CLIENT_ID` = your client ID
   - `GOOGLE_CLIENT_SECRET` = your secret
7. Redeploy

---

## Environment Variables Reference

```env
# Required
DATABASE_URL="postgresql://..."           # Neon PostgreSQL
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="random-32-char-string"

# Email (optional)
RESEND_API_KEY="re_xxxxxxxx"
RESEND_FROM_EMAIL="CoLLM <reports@yourdomain.com>"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
```

---

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy and fill .env
cp .env.example .env

# Generate Prisma client + push schema
npm run db:push

# Seed demo user (demo@collm.app / collm2024!)
npm run db:seed

# Start dev server
npm run dev
```

Open http://localhost:3000

---

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:seed` | Seed demo user |
| `npm run lint` | Run ESLint |

---

## Troubleshooting

### Build fails: postcss error
→ Check `postcss.config.mjs` uses `{ tailwindcss: {}, autoprefixer: {} }` format

### "Prisma Client not generated"
```bash
npm run db:push
```

### "Invalid DATABASE_URL"
→ Make sure connection string ends with `?sslmode=require` for Neon

### Email not sending
→ Check `RESEND_API_KEY` is set; verify domain in Resend dashboard

### Training/Evaluation shows error
→ Features work without login (client-side simulation). For DB persistence, sign in first.

### "NEXTAUTH_URL mismatch"
→ Must match exactly the URL you're accessing, including protocol and no trailing slash
