# VL Proconstruction — Website Guide

Welcome! This is a plain-language guide to your website and how to use it
day to day. No technical knowledge needed.

**Your website:** https://vlproco.com

---

## What your website does

It's your 24/7 salesperson. Visitors can:

- Browse your services (Custom Showers, Tile & Natural Stone, Hard Surface Flooring)
- See photos of your finished projects and read your Google reviews
- Click **"Get a Free Estimate"** and answer a few quick questions —
  project type, budget, timeline, address, and contact info

Every completed estimate request becomes a **lead** that goes straight to you.

## Where your leads go

Each lead arrives in **two places at the same time**:

1. **Email** — you get a message with everything the customer entered:
   name, phone, email, project, budget, timeline, and address.
   If the subject starts with **[possible spam]**, the system suspects a bot —
   double-check before driving out, but the lead is still saved just in case.

2. **Google Sheet** — every lead is also saved as a row in your
   "Leads" spreadsheet, so nothing ever gets lost, even if an email
   goes to spam. Times are shown in Florida time.

> **Tip:** check your email's spam folder the first week and mark our
> messages "Not spam" if any land there.

## Working your leads in the Google Sheet

The **Status** column (second column) is your simple pipeline. Click a cell
and pick from the dropdown:

| Status | Meaning |
|---|---|
| **New** | Just came in — nobody has called yet (shown in red) |
| **Contacted** | You reached out |
| **Estimate scheduled** | Visit booked |
| **Quote sent** | Price delivered |
| **Won** | Job booked 🎉 (green) |
| **Lost** | Went another way |
| **Spam** | Not a real request |

A good habit: every lead marked **New** gets a call the same day —
speed wins jobs.

### Please don't:

- **Rename or delete the "Leads" tab** or its column headers —
  new leads are filed by those exact names
- **Delete rows** unless you're sure — there's no undo history for you
- **Share the spreadsheet publicly** — it contains customer phone numbers
  and addresses

Adding your own notes? Use the empty columns on the far right — that's safe.

## If you run ads (Google Ads, Facebook)

The sheet automatically records **where each lead came from** — which ad
platform, which campaign, even which keyword (the "UTM" columns and
"Click ID" on the right side). When you hire someone to run ads, show them
those columns — they'll know exactly which ads bring real customers and
which just spend money.

## Costs

Everything is already set up and running. Your only recurring cost is the
domain name **vlproco.com** (a small yearly renewal fee).

## Common questions

**Where do lead emails go right now?**
To the address your developer configured. Want them at a different email
(or several)? Ask your developer — it's a 2-minute change.

**A customer says they submitted the form but I got nothing.**
Check the Google Sheet first — the row is the source of truth. Then check
your spam folder. If the row isn't in the sheet either, contact your developer.

**Can I change photos / text / prices on the site?**
Yes — through your developer. The site has no self-service editor;
that's what keeps it fast and secure.

**The site looks broken / the form doesn't work.**
Contact your developer with a screenshot and what you clicked. Don't worry —
leads already saved in the sheet are never affected.

## Good things to keep safe

- The Google account that owns the **Leads spreadsheet**
- Access to your **domain registrar** (where vlproco.com is registered)
- Your **Cloudflare** account login

That's it. The site works for you around the clock — your only job is to
answer the leads fast. 💪

---

## For developers

Everything below is technical — clients can stop reading here. 🙂
Full internal documentation lives in [`CLAUDE.md`](./CLAUDE.md).

### Stack

- [Astro 5](https://astro.build) static site (SSG) — no backend, no adapter,
  plain `dist/` output
- Tailwind CSS v4 (build-time via `@tailwindcss/vite`)
- Self-hosted fonts (`public/assets/fonts/`), vanilla JS only — no UI framework
- Leads: the estimate wizard POSTs to a Google Apps Script webhook that
  writes to a Google Sheet and sends the notification email
  (script + setup guide: [`docs/leads-webhook/`](./docs/leads-webhook/))

### Run locally

```bash
# requires Node 22+
npm install
npm run dev        # dev server at http://localhost:4321
```

Other commands:

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build locally
npm run check      # TypeScript type-check
```

### Deploy

Hosted on **Cloudflare Pages**, connected to this repo. Every push to
`main` triggers a build and deploy automatically:

- Build command: `npm run build`
- Output directory: `dist`
- No environment variables needed

### Where things live

| Path | What it is |
|---|---|
| `src/pages/` | The pages (home, services, 404) |
| `src/components/` | Header, Footer, estimate wizard, SEO |
| `src/lib/site.ts` | **Single source of truth** for business info, URLs, API keys |
| `src/styles/global.css` | Design tokens, fonts, shared component styles |
| `docs/leads-webhook/Code.gs` | The Apps Script behind the lead form (deployed in the client's Google Sheet) |
| `public/_headers` | Cloudflare cache rules |
| `src/unreleased/` | Parked routes (blog, location pages) — not built |

### Keys & secrets

- The Google Maps key and reCAPTCHA **site** key in `src/lib/site.ts` are
  public by design (they ship in the client bundle) and are
  domain/referrer-restricted in their Google consoles.
- The reCAPTCHA **secret** is deliberately NOT in this repo — it lives only
  in the deployed Apps Script. If you copy `Code.gs` into Apps Script,
  re-add the secret to `RECAPTCHA_SECRET` before deploying a new version.
