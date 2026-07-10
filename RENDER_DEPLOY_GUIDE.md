# 🚀 Complete Render.com Deployment Guide - CoLLM

> **Goal**: Deploy CoLLM full-stack app on Render free tier with 24/7 uptime using self-ping

---

## 📋 Table of Contents
1. [GitHub Setup](#step-1-github-setup)
2. [Backend Deployment](#step-2-deploy-backend)
3. [Frontend Deployment](#step-3-deploy-frontend)
4. [Self-Ping Setup](#step-4-self-ping-setup)
5. [Custom Domain](#step-5-custom-domain-optional)
6. [Monitoring](#step-6-monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Step 1: GitHub Setup

### 1.1 Best Repository Names

| Name | Why Good | Best For |
|------|----------|----------|
| **collm-recommender** ⭐ | Clear, professional, searchable | Resume/Portfolio |
| **collm-capstone** | Academic context | University submission |
| **llm-collaborative-rec** | SEO-friendly, descriptive | Research visibility |
| **collm-ai-recommendation** | Modern, AI-focused | Industry appeal |
| **smart-recommender-collm** | User-friendly | Demo/marketing |
| **collm-ml-project** | Simple, clear | Academic projects |

**⭐ TOP RECOMMENDATION**: `collm-recommender`
- Easy to remember
- Professional for resume
- Clear what project does
- Good for GitHub search

### 1.2 Create Repository
```bash
# On GitHub.com → New Repository
# Name: collm-recommender
# Description: "CoLLM: Integrating Collaborative Embeddings into LLMs for Recommendation - Capstone Project"
# Public (needed for free Render)
# Add .gitignore: Python
# License: MIT
```

### 1.3 Push Code
```bash
cd collm_capstone

git init
git add .
git commit -m "🎓 CoLLM Capstone - Initial Commit

Complete implementation including:
- FastAPI backend with CoLLM model
- React frontend with interactive dashboard  
- Docker deployment ready
- ML-1M & Amazon-Book dataset support
- Two-step training pipeline"

git remote add origin https://github.com/YOUR_USERNAME/collm-recommender.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend

### 2.1 Sign Up on Render
- Go to [render.com](https://render.com)
- Click "Get Started for Free"
- **Sign up with GitHub** (easiest, connects repos automatically)

### 2.2 Create Web Service
1. Dashboard → **"New +"** → **"Web Service"**
2. **Connect GitHub repository**: Select `collm-recommender`
3. Configure:

```
Name:               collm-backend
Root Directory:     backend
Runtime:            Python 3
Build Command:      pip install -r requirements.txt
Start Command:      uvicorn main:app --host 0.0.0.0 --port $PORT
Plan:               Free
```

4. **Environment Variables**:
```
PYTHON_VERSION = 3.9.0
```

5. **Advanced Settings**:
```
Health Check Path:  /health
Auto-Deploy:        Yes
```

6. Click **"Create Web Service"**

### 2.3 Wait & Verify
- Build takes **5-10 minutes** (installs PyTorch)
- Watch logs in Render dashboard
- Once done, test: `https://collm-backend.onrender.com/health`
- Should return: `{"status":"healthy","model_loaded":true}`

---

## Step 3: Deploy Frontend

### 3.1 Create Static Site
1. Dashboard → **"New +"** → **"Static Site"**
2. **Connect same GitHub repo**
3. Configure:

```
Name:               collm-frontend
Root Directory:     frontend
Build Command:      npm install && npm run build
Publish Directory:  build
Plan:               Free
```

4. **Environment Variables**:
```
REACT_APP_API_URL = https://collm-backend.onrender.com
```

5. Click **"Create Static Site"**

### 3.2 Wait & Verify
- Build takes **3-5 minutes**
- Test: `https://collm-frontend.onrender.com`
- Should show the CoLLM dashboard

---

## Step 4: Self-Ping Setup (CRITICAL)

### ⚠️ THE PROBLEM
Render free tier **sleeps after 15 minutes of inactivity**
- First request after sleep takes **30-60 seconds** (cold start)
- Bad user experience!

### ✅ THE SOLUTION: Self-Ping Every 10 Minutes

#### Option A: GitHub Actions (FREE ⭐ Recommended)

**Why GitHub Actions?**
- Completely free (2000 minutes/month)
- Runs on GitHub servers (not your computer)
- No setup needed after initial config
- Works 24/7 even if your laptop is off

**Setup:**

1. The file `.github/workflows/keep-alive.yml` is already in your repo
2. Go to GitHub → Your repo → **Actions** tab
3. Click **"I understand my workflows, go ahead and enable them"**
4. The workflow will automatically run every 10 minutes
5. Verify: Actions tab → "Keep Render Services Awake" → should show green checkmarks

**What it does:**
```
Every 10 minutes:
  → Ping backend /health endpoint
  → Ping frontend homepage
  → Log results
  → Keep services awake!
```

#### Option B: UptimeRobot (FREE - Backup)

**Why UptimeRobot?**
- Independent of GitHub
- 5-minute intervals (faster than GitHub Actions)
- Email alerts if down
- Public status page

**Setup:**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free)
3. **Add Monitor**:
   - Type: HTTP(s)
   - Name: "CoLLM Backend"
   - URL: `https://collm-backend.onrender.com/health`
   - Interval: 5 minutes
4. Add second monitor:
   - Name: "CoLLM Frontend"
   - URL: `https://collm-frontend.onrender.com`

#### Option C: Python Script (Local - Not Recommended)

Only use if you have a computer running 24/7:

```bash
# Install dependencies
pip install requests

# Run manually
python scripts/ping_render.py

# Or setup cron (Linux/Mac)
crontab -e
# Add: */10 * * * * cd /path/to/project && python3 scripts/ping_render.py
```

**⚠️ NOT recommended** - computer must stay on, not reliable

---

## Step 5: Custom Domain (Optional)

### 5.1 Buy Domain
| Registrar | Price | Why |
|-----------|-------|-----|
| **Namecheap** | ~$9/year | Cheap, good support |
| **Cloudflare** | ~$8/year | Best DNS, free CDN |
| **Google Domains** | ~$12/year | Simple, reliable |

### 5.2 Recommended Domain Names
| Domain | Availability | Price |
|--------|-------------|-------|
| collm-demo.com | Likely | ~$10/yr |
| collm-ai.com | Likely | ~$10/yr |
| smart-collm.com | Likely | ~$10/yr |
| yourname-collm.com | Likely | ~$10/yr |

### 5.3 Connect to Render
1. Buy domain
2. Render Dashboard → Your Service → Settings → Custom Domain
3. Add domain and follow DNS instructions
4. Update CORS in `backend/main.py`
5. Push changes

---

## Step 6: Monitoring

### 6.1 Render Dashboard
- CPU/Memory usage
- Request logs
- Deployment history
- **URL**: `https://dashboard.render.com`

### 6.2 UptimeRobot Dashboard
- Uptime percentage
- Response time history
- Downtime alerts
- **URL**: `https://uptimerobot.com/dashboard`

### 6.3 GitHub Actions
- Workflow runs
- Execution history
- **URL**: `https://github.com/YOUR_USERNAME/collm-recommender/actions`

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Build failed" | Missing dependency | Check `requirements.txt` |
| "CORS error" | Wrong origin | Update `allow_origins` in main.py |
| "Service sleeping" | No traffic | Verify self-ping is working |
| "Out of memory" | Model too big | Use smaller LLM or upgrade plan |
| "Slow first load" | Cold start | Normal for free tier, self-ping helps |
| "Frontend not loading" | Build error | Check `npm run build` locally |
| "API not responding" | Backend down | Check Render logs |

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| GitHub Repo | **FREE** | Public repository |
| Render Backend | **FREE** | Sleeps after 15 min (self-ping fixes) |
| Render Frontend | **FREE** | Static site, always fast |
| GitHub Actions | **FREE** | 2000 min/month (self-ping uses ~1440 min) |
| UptimeRobot | **FREE** | 5 min interval |
| Custom Domain | ~$10/yr | Optional |
| **TOTAL** | **$0-10/yr** | **Completely free possible!** |

---

## Quick Reference Card

```
🔗 URLs AFTER DEPLOYMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GitHub:    https://github.com/YOUR_USERNAME/collm-recommender
Backend:   https://collm-backend.onrender.com
API Docs:  https://collm-backend.onrender.com/docs
Frontend:  https://collm-frontend.onrender.com
Monitor:   https://uptimerobot.com/dashboard
Render:    https://dashboard.render.com

📁 IMPORTANT FILES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
backend/main.py          → Update CORS origins
backend/requirements.txt → Python dependencies
frontend/package.json    → Node dependencies
render.yaml              → Render config (optional)
.github/workflows/       → Self-ping automation

🔧 QUICK COMMANDS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test locally
cd backend && uvicorn main:app --reload
cd frontend && npm start

# Deploy updates
git add . && git commit -m "update" && git push

# Check logs
curl https://collm-backend.onrender.com/health
```

---

## 🎉 Success Checklist

- [ ] GitHub repo created with good name
- [ ] Code pushed to GitHub
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Render
- [ ] CORS updated with frontend URL
- [ ] GitHub Actions enabled for self-ping
- [ ] UptimeRobot monitors added
- [ ] Tested all API endpoints
- [ ] Verified frontend loads correctly
- [ ] Shared link on resume/LinkedIn

**Your CoLLM project is now LIVE 24/7! 🚀**
