# Leads webhook setup (Google Sheets + email)

The estimate wizard POSTs each lead to a Google Apps Script attached to the
client's Google Sheet. The script appends a row to a **Leads** tab and emails
a notification. Free, no hosting, no API keys.

One-time setup (~5 minutes), done from the Google account that should own the
lead sheet (ideally the client's):

1. **Create the sheet** — go to [sheets.new](https://sheets.new), name it e.g.
   `VL Proconstruction — Leads`.
2. **Add the script** — in the sheet: **Extensions → Apps Script**. Delete the
   placeholder code and paste the contents of [`Code.gs`](./Code.gs).
   Adjust `NOTIFY_EMAIL` at the top if leads should go somewhere other than
   the business Gmail.
3. **Deploy** — click **Deploy → New deployment**, gear icon → **Web app**:
   - Description: `estimate form webhook`
   - Execute as: **Me**
   - Who has access: **Anyone**  ← required; the website posts anonymously
   Click **Deploy**, approve the permissions prompt (it asks for Sheets +
   email access — that's the script itself, this is expected), and copy the
   **Web app URL** (ends in `/exec`).
4. **Wire the site** — paste that URL into `estimateWebhook` in
   `src/lib/site.ts`, then commit/push. Vercel rebuilds and the form is live.
5. **Test** — submit the form on the live site. A row should appear on the
   **Leads** tab and the notification email should arrive within a minute.

## Working the leads (Status column)

Every lead arrives with **Status = New** (column B). The column has a
dropdown — click a cell to move the lead through the pipeline:
`New → Contacted → Estimate scheduled → Quote sent → Won / Lost / Spam`,
each stage with its own color. The dropdown and colors are created
automatically when the Leads tab is first created by the script.

## Updating the script later

Edit the code in Apps Script, then **Deploy → Manage deployments → ✏️ edit →
Version: New version → Deploy**. The URL stays the same. (Just saving the file
without deploying a new version does NOT update the live webhook.)

## reCAPTCHA v3 (optional but recommended)

The form and webhook are pre-wired for invisible reCAPTCHA v3 — no checkbox,
no user friction. It stays disabled until both keys are filled in:

1. Register the site at
   [google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create):
   - Type: **Score based (v3)**
   - Domains: `localhost`, `vl-construction.vercel.app`, and the real domain
     when it lands
2. Copy the **site key** into `recaptchaSiteKey` in `src/lib/site.ts`
   (public, ships in the bundle — that's how reCAPTCHA works).
3. Copy the **secret key** into `RECAPTCHA_SECRET` at the top of the Apps
   Script, then redeploy a new version (see "Updating the script later").

With the secret set, the webhook rejects submissions whose token is missing
or invalid — those are bots POSTing at the URL directly, never the website
form. A genuine token with a score below `RECAPTCHA_MIN_SCORE` (default 0.5)
is **saved anyway** and flagged: the notification email subject gets a
`[possible spam]` prefix and the body shows the score. A false alarm never
costs a real lead. If Google's verify endpoint is down, the webhook fails
open for the same reason.

## Notes

- **Spam**: the form includes a hidden "company" honeypot field; the script
  silently drops any submission that fills it. reCAPTCHA (above) is the
  second layer.
- **Ad attribution**: leads carry `utm_source/medium/campaign/term/content`,
  a Google/Facebook click ID, and the landing URL when the visitor arrived
  via a tagged ad link — stored in their own sheet columns and shown as a
  "Source" line in the email. No setup needed beyond tagging the ad URLs
  (e.g. `?utm_source=google&utm_medium=cpc&utm_campaign=showers`). After
  script updates that add columns, headers refresh automatically on the
  next lead.
- **Empty `estimateWebhook`**: the site still works — submissions just log to
  the browser console and show the success screen (dev-friendly default).
- **Email quota**: consumer Gmail Apps Script can send ~100 emails/day —
  far above expected lead volume.
- The row is written before the email is sent, so a mail failure never loses
  a lead.
