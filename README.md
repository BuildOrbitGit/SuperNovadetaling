# Supernova Automobile Detailing

Premium mobile car detailing website for Kelowna, BC. Static site with Vercel serverless API routes for the booking pipeline.

**Live URL:** https://supernova-detailing.vercel.app

---

## What Was Built

### Site Changes
- Hero CTAs ("Text to Book", "Book Now") open the booking modal instead of linking to SMS
- Before/after comparisons use a horizontal squeegee wipe animation (left → right) triggered on scroll into view, with a "↺ tap to replay" hint after it completes
- All images live in the project root (no `assets/images/` prefix)

### Booking System
A 5-step booking modal in vanilla JS — no frameworks. Customer fills in details, owner gets an email with Confirm/Decline buttons, and on confirmation the client gets an email with a `.ics` calendar invite and the event is added to Google Calendar automatically.

---

## Booking Flow

```
Customer clicks "Book Now"
        ↓
Step 1 — Date & Time
  • Monthly calendar, past dates disabled, month navigation
  • 7 time slots appear after selecting a date

Step 2 — Vehicle Details
  • Make (35+ brands) → cascading Model dropdown → Year (1990–present)
  • Optional colour field
  • Vehicle type: Car/Sedan, SUV/Crossover, Truck, Van, Sports Car

Step 3 — Service Package + Add-Ons
  • Cosmic Express — Basic Maintenance ($99 / $139 SUV)
  • Lunar Detail — Deep Clean ($159 / $199 SUV)  ← default selected
  • Supernova Detail — Premium Restoration ($199 / $239 SUV)
  • Optional add-ons: Engine Bay Detail, Headlight Restoration,
    Pet Hair Removal, Odor Elimination, Ceramic Spray Sealant

Step 4 — Contact Details
  • Full name, phone, email, service address
  • Up to 4 vehicle photos (auto-resized to 900px JPEG in the browser)
  • Optional notes / special requests

Step 5 — Review & Submit
  • Full summary of all selections
  • "Send Booking Request" → POST /api/book
        ↓
Owner receives styled HTML email with all booking details and:
  [✓ Confirm Booking]  →  GET /api/confirm?token=...
  [✗ Decline]          →  GET /api/decline?token=...
        ↓
If CONFIRMED:
  • Event added to Google Calendar via service account
  • Client gets confirmation email with .ics calendar file attached

If DECLINED:
  • Client gets decline email with SMS reschedule link (604-728-3247)
```

The `token` in the confirm/decline URLs is a base64url-encoded JSON blob of the booking — no database required.

---

## Project Structure

```
/
├── index.html              # Main page
├── style.css               # All styles (bk- prefix = booking modal)
├── script.js               # All client JS
├── package.json            # resend, @vercel/blob, googleapis
├── .env.example            # Environment variable template
├── vercel.json             # Security + cache headers
├── api/
│   ├── book.js             # POST — validates, uploads photos, emails owner
│   ├── confirm.js          # GET  — Google Calendar + confirmation email to client
│   └── decline.js          # GET  — decline email with reschedule prompt
└── [images]                # All images in root (no subdirectory)
```

---

## Environment Variables

Set these in [Vercel → Settings → Environment Variables](https://vercel.com/buildorbitstudios-projects/supernova-detailing/settings/environment-variables):

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from resend.com |
| `OWNER_EMAIL` | Where booking request emails are sent |
| `FROM_EMAIL` | Sender address e.g. `Supernova Detailing <bookings@supernovadetailing.ca>` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (Vercel dashboard → Storage tab) |
| `GOOGLE_CLIENT_EMAIL` | Service account email (see Google Calendar setup below) |
| `GOOGLE_PRIVATE_KEY` | Service account private key (see below) |
| `GOOGLE_CALENDAR_ID` | Calendar ID to add events to — use `primary` for the main calendar |

---

## Google Calendar Setup

The booking system uses a **Google Service Account** — no OAuth login flow, no user interaction. When you click Confirm, the event is added to your calendar automatically.

### 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **New Project**, name it (e.g. "Supernova Detailing"), click **Create**
3. Confirm the new project is selected in the top bar

### 2. Enable the Google Calendar API

1. Go to **APIs & Services → Library**
2. Search **Google Calendar API**, click it, click **Enable**

### 3. Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → Service Account**
3. Name it (e.g. `supernova-calendar-bot`), click **Create and Continue**
4. Skip the role and user steps — click **Done**
5. On the Credentials page, click the service account email to open it
6. Go to **Keys** tab → **Add Key → Create new key → JSON**
7. A `.json` file downloads — save it somewhere safe (you only get this once)

### 4. Extract the Credentials

Open the downloaded JSON. You need exactly two values:

```json
{
  "client_email": "supernova-calendar-bot@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n"
}
```

- `client_email` → paste as `GOOGLE_CLIENT_EMAIL` in Vercel
- `private_key` → paste as `GOOGLE_PRIVATE_KEY` in Vercel (paste the entire string including the `-----BEGIN` and `-----END` lines — Vercel handles the newlines correctly)

### 5. Share Your Calendar with the Service Account

1. Open [calendar.google.com](https://calendar.google.com)
2. Find the calendar you want bookings added to, click the three dots → **Settings and sharing**
3. Scroll to **Share with specific people or groups → Add people**
4. Paste the service account email (e.g. `supernova-calendar-bot@your-project.iam.gserviceaccount.com`)
5. Set permission to **Make changes to events**, click **Send**

### 6. Get Your Calendar ID

Still in calendar settings, scroll to **Integrate calendar** and copy the **Calendar ID**. It looks like `abc123@group.calendar.google.com` or just your Gmail address for the primary calendar.

Set this as `GOOGLE_CALENDAR_ID` in Vercel. Use `primary` to write to the main account calendar.

---

## Resend (Email) Setup

1. Create a free account at [resend.com](https://resend.com)
2. Go to **API Keys → Create API Key** → set as `RESEND_API_KEY`
3. Go to **Domains → Add Domain**, verify your domain with the DNS records they give you
4. Once verified, set `FROM_EMAIL` to an address at that domain e.g. `bookings@supernovadetailing.ca`

> During testing before your domain is verified, set `FROM_EMAIL` to `Supernova Detailing <onboarding@resend.dev>` — Resend allows this but only delivers to the account owner's email.

---

## Deploying Updates

Always push to GitHub first, then Vercel:

```bash
git add .
git commit -m "your message"
git push origin main
vercel --prod
```

The `.vercel/project.json` file locks the CLI to the correct Vercel project — don't delete it.

### First-time setup on a new machine

```bash
vercel login
vercel --prod --scope buildorbitstudios-projects
```

---

## Local Development

**Frontend only** (no API routes):
```bash
python3 -m http.server 4200
# open http://localhost:4200
```

**Full stack including API routes:**
```bash
npm install -g vercel
cp .env.example .env.local
# fill in .env.local with real keys
vercel dev
# open http://localhost:3000
```

---

## How the Vercel CLI Bypass Works

Your account sits inside the `buildorbitstudios-projects` team. The Vercel web dashboard enforces an enterprise onboarding flow for new projects. The CLI skips this entirely by hitting the API directly:

```bash
vercel --prod --scope buildorbitstudios-projects --yes
```

After the first deploy, Vercel writes `.vercel/project.json` which locks future `vercel --prod` calls to the right project with no extra flags needed.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML / CSS / JS, GSAP |
| Hosting | Vercel (static + serverless functions) |
| Email | Resend API |
| Photo storage | Vercel Blob |
| Calendar | Google Calendar API (service account JWT) |
| Booking tokens | Base64url-encoded JSON (stateless, no database) |
