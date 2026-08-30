# CoLLM Email Setup — Gmail SMTP (Free, No Domain Required)

## Why Gmail SMTP?

Resend requires a verified domain to send to other users.
Gmail SMTP works with just a Google account — free, instant, no domain purchase.

## Architecture

```
CoLLM Platform
      │
      ▼
Gmail SMTP (port 587, STARTTLS)
      │
      ▼
Any recipient email (Gmail, Outlook, Yahoo, corporate)
```

## Required Environment Variables

```env
EMAIL_USER=collm.platform@gmail.com   # Your sending Gmail account
EMAIL_PASS=abcdefghijklmnop           # Google App Password (16 chars, no spaces)
```

## Step-by-Step Setup

### 1. Create Sending Gmail Account
Create a new Gmail account specifically for sending:
- `collm.platform@gmail.com`
- `collm.notifications@gmail.com`

**Why separate?** Your app password gives access to this account. Keep it separate from personal email.

### 2. Enable 2-Step Verification
This is required before App Passwords work.

```
https://myaccount.google.com/security
→ 2-Step Verification
→ Get started
→ Follow prompts
```

### 3. Generate App Password

```
https://myaccount.google.com/apppasswords
→ Select app: Other (Custom name)
→ Enter: CoLLM Platform
→ Generate
```

Google shows: `abcd efgh ijkl mnop`
**Copy and REMOVE all spaces**: `abcdefghijklmnop`

### 4. Add to Vercel

```
Vercel Dashboard
→ Your Project
→ Settings
→ Environment Variables
→ Add:

  EMAIL_USER = collm.platform@gmail.com
  EMAIL_PASS = abcdefghijklmnop
```

### 5. Redeploy
After saving env vars, Vercel auto-redeploys (or click Redeploy manually).

## What Gets Sent

### Report Emails (POST /api/email)
```
From:    "CoLLM Research Platform" <collm.platform@gmail.com>
Subject: 📊 CoLLM Evaluation Report — CoLLM-LightGCN on MovieLens-1M
```

Includes:
- Key metrics table (AUC/UAUC/NDCG for Overall/Warm/Cold)
- Warm/Cold analysis table
- All models comparison table (top 8)
- Official report badge with date
- Paper reference: arXiv:2310.19488v3

### Contact Acknowledgment (POST /api/contact)
```
From:    "CoLLM Research Platform" <collm.platform@gmail.com>
Subject: ✅ Message received — [their subject]
```

## Gmail Limits

| Limit | Value |
|-------|-------|
| Daily send limit | 500 emails/day |
| Per-message recipients | 500 |
| Rate limit | ~20 emails/min |

For production with >500 daily emails, upgrade to:
- **Resend** (requires verified domain)
- **SendGrid** (free tier: 100/day)
- **Mailgun** (free tier: 100/day)

## Troubleshooting

### "Invalid login: 535 Authentication Failed"
- App password has spaces → remove all spaces
- 2-Step Verification not enabled → enable it first
- Wrong Gmail account → double-check EMAIL_USER

### "Connection timeout"
- Vercel blocks outbound SMTP on hobby plan
- Upgrade to Vercel Pro, or use Resend/SendGrid API instead

### Emails go to spam
- Add SPF record to your domain (if you have one)
- Ask recipients to mark as "Not Spam"
- Use a dedicated sending domain for production

## Code Reference

```typescript
// lib/email.ts — getTransporter()
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // App Password, not regular password
  },
});
```

## Moving to Production (Later)

When you have a domain:
1. Verify domain at resend.com
2. Add DNS records (SPF, DKIM, MX)
3. Replace EMAIL_USER/PASS with RESEND_API_KEY
4. Update lib/email.ts to use Resend SDK

```env
# Production with domain
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL="CoLLM <reports@collm.ai>"
```
