# SalesEdge — Sales Objection Handling Assistant + Subscription System

A rebuild of the Sales Objection Handling Assistant (form → AI-generated Sales
Intelligence Report using the **Stab & Twist** and **6KLH** methodologies),
wrapped in a full subscription / token / mock-payment system.

Built for the GreyBox Technologies assignment.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for the dark UI
- **lucide-react** icons
- **Google Gemini API** (free tier) for report generation — called from a
  server route so the key is never exposed to the browser
- **localStorage** for auth, subscriptions, tokens, usage history and admin
  transcripts (no backend database)

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your Gemini key
npm run dev
```

Open http://localhost:3000.

### Environment variables

Get a free key at https://aistudio.google.com/app/apikey.

| Variable                      | Required | Notes                                              |
| ----------------------------- | -------- | -------------------------------------------------- |
| `GEMINI_API_KEY`              | yes\*    | Server-only. Preferred.                            |
| `NEXT_PUBLIC_GEMINI_API_KEY`  | no       | Fallback, supported for the assignment brief.      |
| `GEMINI_MODEL`                | no       | Defaults to `gemini-3.6-flash`.                    |

\* At least one of the two key variables must be set.

## Subscription plans

| Plan                | Price          | Tokens / month | PDF & sharing | Duration        |
| ------------------- | -------------- | -------------- | ------------- | --------------- |
| Always Free         | ₹0             | 3              | ✗             | Forever         |
| Free 1 Month Trial  | ₹0             | 50             | ✓             | 30 days, then Always Free |
| Monthly             | ₹999 / month   | 100            | ✓             | Ongoing         |
| One-Time (Lifetime) | ₹4,999 once    | Unlimited      | ✓             | Forever         |

- Each report generation consumes **1 token**.
- Quotas reset on the **1st of every month** (lifetime is uncapped).
- At 0 tokens the form shows an upgrade modal instead of generating.

## Mock payment

`/payment?plan=monthly|lifetime` — a fake checkout. Any card / expiry / CVV is
approved after a 2-second delay, the plan is upgraded in `localStorage`
immediately, and a confetti success screen is shown. **No real gateway.**

## Admin — transcript training

`/admin` (password: `admin123`)

Upload `.txt` transcript files. Their contents are stored in `localStorage` and
injected as additional grounding context into every Gemini call. Each transcript
can be deleted from the list.

## Pages

| Route        | Purpose                                                  |
| ------------ | ------------------------------------------------------- |
| `/`          | Sales situation form                                    |
| `/results`   | Report output — 4 tabs, downloads, sharing              |
| `/pricing`   | 4-plan comparison + upgrade buttons                     |
| `/login`, `/signup` | Email + password auth (localStorage)            |
| `/dashboard` | Account, current plan, token balance, usage history     |
| `/payment`   | Mock payment flow                                       |
| `/admin`     | Transcript upload & management                          |

Protected routes (`/results`, `/dashboard`, `/payment`) redirect to `/login`.

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Then add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in the Vercel project's
**Settings → Environment Variables**, and redeploy.
