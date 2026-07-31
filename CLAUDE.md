# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# VL Proconstruction — Website

Project rules live in two files, both imported here so they're loaded every session:

- **Design rules** → @claude-design.md
- **Development rules** → @claude-development.md

Figma reference: https://www.figma.com/design/2PhiSh4AgPs29bOkoCIjs9/vl-construction?node-id=44-1435&t=8SFMPPWT6s5MdVwq-1

## Stack

**Astro 5** static site with SSG output. No backend, no adapter — plain static `dist/`. Key dependencies (all in `package.json`):
- `astro` ^5.14 — framework and build
- `@astrojs/sitemap` — emits `/sitemap-index.xml` + `/sitemap-0.xml` at build
- `@astrojs/check` + `typescript` — strict type-checking
- `tailwindcss` ^4 + `@tailwindcss/vite` — build-time Tailwind (no CDN)

`astro.config.mjs` at the project root: sets `site: 'https://vl-proconstruction.pages.dev'`, `trailingSlash: 'ignore'` (both `/foo` and `/foo/` resolve; canonicals use the trailing form), `build.format: 'directory'`, and the sitemap integration.

`tsconfig.json` extends `astro/tsconfigs/strict`. Path aliases: `@/*` → `src/*`, `@components/*` → `src/components/*`, `@layouts/*` → `src/layouts/*`, `@content/*` → `src/content/*`.

## Commands

- `npm run dev` — `astro dev` at http://localhost:4321
- `npm run build` — `astro build` (outputs static site to `dist/`)
- `npm run preview` — `astro preview`
- `npm run check` — `astro check` (TypeScript type-check)

## Deployment

**Cloudflare Pages**, connected to the GitHub repo `VLProconstructionDev/vl-proconstruction` (public — which is why the repo copy of `Code.gs` has an EMPTY `RECAPTCHA_SECRET`; the real secret lives only in the deployed Apps Script). Framework preset: Astro; build command `npm run build`; output directory `dist`. No adapter — the site is fully static. Cloudflare serves `dist/404.html` as the custom 404 automatically, and `public/_headers` sets immutable caching for `/_astro/*` (this replaced what the old Vercel adapter used to configure). History note: the project migrated to this repo 2026-07-31 as a single squashed commit; the full early history lives in the old private repo `alexdatsyk/vl-construction` (local remote `old-origin`, local branch `main-old-history`). The project previously deployed on Vercel (`vl-construction.vercel.app`) — those projects should be deleted in the Vercel dashboard.

**⚠️ `https://vl-proconstruction.pages.dev` is a TEMPORARY test URL** — the real production domain (likely `vlproco.com`) is coming. When it lands, update the URL in all three places (it feeds canonicals, og:url, sitemap, and JSON-LD):
1. `astro.config.mjs` — the `SITE` constant
2. `src/lib/site.ts` — the `url` field
3. `public/robots.txt` — the `Sitemap:` line

Then rebuild and verify: `grep -r "pages.dev" dist/ --include="*.html" -l` should return nothing, add the custom domain to the Cloudflare Pages project, and set a redirect from `*.pages.dev` to the primary domain (Pages → Custom domains, or a `_redirects` rule). Also update the Google-side allowlists: reCAPTCHA key domains + Maps key referrer restrictions.

## Architecture

Multi-page marketing site generated at build time. No runtime server. Shared components (Header, Footer, EstimateWizard) live in `src/components/` and are composed via layouts — not duplicated per page. Page-specific CSS goes in `<style is:global>` blocks and page-specific JS in `<script is:inline>` blocks within the relevant `.astro` file.

### Project root files
`astro.config.mjs`, `tsconfig.json`, `package.json`, `package-lock.json`, `CLAUDE.md`, `claude-design.md`, `claude-development.md`, `.gitignore`. Plus `docs/leads-webhook/` — the Google Apps Script (`Code.gs`) + setup guide (`SETUP.md`) for the estimate-form lead webhook (not part of the build). Gitignored: `dist/`, `.astro/`, `node_modules/`, `_pre-optimize-backup/` (pre-webp image/video originals).

### src/ layout

```
src/
  styles/global.css        — Tailwind v4 @import + @theme tokens + shared component CSS
  lib/site.ts              — business info (single source of truth)
  lib/schema.ts            — JSON-LD builders
  content.config.ts        — collection definitions (services, locations, blog)
  content/
    services/*.md          — one file per service offering
    locations/*.md         — one file per city/area
    blog/*.md              — blog posts
  layouts/
    BaseLayout.astro       — wraps every page
    ServiceLayout.astro    — collection-driven service-page shell (used only by the PARKED service×location route)
  components/
    SEO.astro              — <head> meta, OG, Twitter, JSON-LD
    Header.astro           — nav, mobile menu, navbar observer, navCta reveal
    Footer.astro           — footer (reads from site.ts)
    EstimateWizard.astro   — full-screen overlay wizard (rendered site-wide)
    ServiceHero.astro      — dark hero shared by service pages
    Breadcrumbs.astro      — accessible breadcrumb list
  pages/
    index.astro            — home page
    404.astro              — branded 404 (noindex: true)
    services/
      index.astro                        — all-services grid (hand-designed)
      custom-showers/index.astro         — static service page (hand-designed)
      tile-natural-stone/index.astro     — static service page (hand-designed)
      hard-surface-flooring/index.astro  — static service page (hand-designed)
  unreleased/              — parked routes, NOT built (see "Unreleased routes" below)
    blog/                  — blog index + [slug] detail
    service-areas/         — index + [location] city landing pages
    service-location/      — [location].astro service × location SEO cross-join
public/
  assets/images/           — webp/jpg/png; subdirs: gallery/, gallery-showers/, brand/
  assets/video/            — hero-0715.mp4 + hero-0715.webm (active); hero.mp4 + hero-custom-showers.mp4 (legacy, unreferenced)
  robots.txt               — points at sitemap
  _headers                 — Cloudflare Pages headers (immutable /_astro/* caching)
```

### Design tokens (`src/styles/global.css`, Tailwind v4 `@theme`)
- Colors: `brand` `#f54b25` (hover `#c23c18`/`#e03f1c`), `brandhead` `#f64e28`, `ink` `#1e1e1e`, `graydesc` `#4e4e4e`, `graycard` `#959595`.
- Fonts: `font-sans` Inter (body), `font-poppins` Poppins, `font-serifd` Source Serif 4. All loaded from Google Fonts in `BaseLayout.astro`'s `<head>`.
- `global.css` also holds shared `#navbar`/`.nav-*`/`#mobileMenu`/`.mm-*`/`.btn` styles that apply to the Header component site-wide, plus `scroll-margin-top: 104px` on all `[id]` elements and the scrollbar-hide + `overflow-x: hidden` resets.

### `src/lib/site.ts`
Single source of truth for business info: `name` (`VL Proconstruction`), `legalName` (`VL Proconstruction LLC`, per the Google Maps listing), `tagline`, `url`, `logo`, `phone` (`(503) 781-4657`), `phoneHref`, `email` (real), `address` (Bradenton, FL), `geo`, `areaServed` (16 Suncoast cities/counties), `social` (real Instagram + Google Maps links), `defaultOgImage`, `estimateWebhook` (Apps Script web-app URL for lead submissions — empty until deployed per `docs/leads-webhook/SETUP.md`), `googleMapsApiKey` (address autocomplete; ships client-side by design — must stay referrer-restricted in Google Cloud console), `recaptchaSiteKey` (reCAPTCHA v3, public by design; the secret lives only in the Apps Script). Imported by SEO, footer, header CTAs, schema builders, and the EstimateWizard script. Remaining `// TODO`s: street address + ZIP and exact business coordinates.

### `src/lib/schema.ts`
JSON-LD builders: `localBusinessSchema()` (GeneralContractor, included on every page via BaseLayout — deliberately minimal for now; a `TODO(after Google Business Profile is set up)` comment lists the enrichment fields to add once GBP exists so values match the listing exactly), `serviceSchema()`, `breadcrumbSchema()`, `articleSchema()`. `SEO.astro` serializes the result into `<script type="application/ld+json">`.

### Layouts

**`BaseLayout.astro`** — every page wraps here. Props: `title`, `description`, `image?`, `noindex?`, `schema?`, `canonical?`, `navTheme?` (`"light"|"dark"` — **advisory only**: it documents the page's hero tone but is NOT rendered to the DOM; the navbar's actual theme comes from each section's `data-nav-theme` attribute — see Gotchas). Renders: `<head>` (meta + fonts + JSON-LD via SEO + page-transition style/script), `<Header />`, `<main><slot /></main>`, `<Footer />`, `<EstimateWizard />`, then Lenis smooth-scroll init (CDN, `lenis@1.1.14`) and page-transition click controller. LocalBusiness JSON-LD is always included; any page-specific `schema` prop is appended.

**`ServiceLayout.astro`** — used only by the parked `src/unreleased/service-location/` route (service × location pages). Takes `service: CollectionEntry<'services'>` and optional `location: CollectionEntry<'locations'>`. When a location is passed, all copy and SEO titles switch to location-scoped variants. Emits Service + Breadcrumb + FAQPage JSON-LD automatically. The LIVE service pages do NOT use it — they're hand-designed static files.

### Components

**`Header.astro`** — nav dropdowns (hover/focus-within reveals `.nav-dd`), mobile full-screen overlay (`#mobileMenu`, `position:fixed; inset:0; 100dvh`, flat `#0b0b0b`, `z-index:60`; `.mm-nav` + `.mm-sub` accordion for Services; `.mm-foot` with "Get a Free Estimate" pill + "Call Now" pill). Contains the navbar theme-switcher — a passive `scroll`/`resize` listener (`updateNav`) that probes which `[data-nav-theme]` section sits behind the navbar via `getBoundingClientRect()` and toggles `#navbar.nav-light`/`.nav-dark`; over `#hero` (when present) the navbar stays transparent and `#navCta` is hidden, past it the CTA reveals. Exposes `window.vlUpdateNav` (called by Lenis on scroll) and `window.vlCloseMenu` (called by EstimateWizard before opening so scroll is restored). Also renders `#mobileCta` (after `</header>`) — a phones-only (hidden ≥768px via a plain media query in `global.css` — Tailwind's `md:hidden` loses to these unlayered styles) sticky bottom CTA capsule ("Get a Free Estimate" + "Call Now", styles under `.mcta*` in `global.css`, z-index 40) that `updateNav` reveals past the hero, or past `0.6 × viewport` on pages without one.

**`EstimateWizard.astro`** — `#estimateOverlay` rendered once site-wide from BaseLayout. Opens whenever any `.js-open-estimate` is clicked. Has a visible `#estClose` ✕ button (top-right) as well as Escape-to-close and browser-Back-to-close (via `history.pushState`/`popstate`; while open, `history.scrollRestoration` is set to `manual` so the browser's automatic restore doesn't clobber the scroll position saved before the body lock — handed back to `auto` after close). Overlay steps 1–6: project picker (checkboxes, "Other → specify"), budget, timeline, address, contact, success panel. The home page's inline `#estimate` section also has its own Step 1 (`#step1Next`); the wizard script wires that up conditionally if the element is present. Vanilla JS handles: scroll-lock, per-step validation with `.wiz-error` messages, US phone mask, email format + MX-record check (fail-open via `dns.google`), and submit. Submit POSTs the lead as JSON to `site.estimateWebhook` (a Google Apps Script that appends to the client's Sheet + sends an email — see `docs/leads-webhook/SETUP.md`; sent as `text/plain` to stay a CORS simple request since Apps Script can't answer preflight). A hidden `company` honeypot field rides along for spam filtering. If `estimateWebhook` is empty the submit falls back to `console.log` + success panel. The address field has Google Places autocomplete: the Maps JS API (`site.googleMapsApiKey`, legacy `Autocomplete` widget — the key's project has legacy Places API enabled, not Places API New) lazy-loads on first overlay open; results are US-only, biased to the Suncoast, `fields: ['formatted_address']` only. The `.pac-container` dropdown is restyled dark in the component's global CSS (z-index 2100, above the overlay's 2000; "powered by Google" attribution kept on a light chip). Enter/Escape are dropdown-aware: with suggestions open, Enter picks the highlighted one instead of advancing and Escape (checked in capture phase, before the widget hides the dropdown) closes suggestions instead of the wizard. Spam protection is two-layer: the honeypot plus invisible reCAPTCHA v3 (`site.recaptchaSiteKey`, lazy-loaded on first overlay open; token sent as `recaptchaToken`, verified server-side in the Apps Script when its `RECAPTCHA_SECRET` is set). The webhook only hard-rejects missing/invalid tokens (direct bot POSTs); a genuine token with a low score saves the lead flagged as possible spam (`[possible spam]` email subject) — and it fails open on Google outages — so a real lead is never lost. Ad attribution: the wizard script captures `utm_source/medium/campaign/term/content` + `gclid`/`fbclid` from any page's query string into `localStorage` (`vlUtm`, last campaign touch wins) and sends them with the lead; the sheet gets UTM/Click ID/Landing page columns (headers self-heal on script updates) and the email a Source line. The floating badge is hidden via CSS, permitted because step 5 shows the reCAPTCHA disclosure with real links to Google's Privacy Policy/Terms.

**`SEO.astro`** — title, description, canonical, OG, Twitter Card, and one `<script type="application/ld+json">` per schema object in the array.

### Content collections (`src/content.config.ts`, Astro 5 `glob` loader)

**`services`** — slug = filename → URL. Fields: `title`, `shortName`, `description`, `seoTitle?`, `seoDescription?`, `heroImage?`, `features[]`, `included[]` (title/body/image), `faqs[]` (q/a — also drives FAQPage JSON-LD), `order`, `published`. Seeded: `custom-showers`, `tile-natural-stone`, `hard-surface-flooring`.

**`locations`** — slug = filename → URL. Fields: `name`, `state`, `county?`, `zips[]`, `lat`, `lng`, `neighborhoods[]`, `intro?`, `seoTitle?`, `seoDescription?`, `heroImage?`, `order`, `published`. Seeded with Suncoast cities: `bradenton`, `sarasota`, `lakewood-ranch`, `venice`.

**`blog`** — slug = filename → URL. Fields: `title`, `description`, `publishedAt`, `updatedAt?`, `author`, `heroImage?`, `tags[]`, `relatedService?`, `relatedLocation?`, `draft` (draft posts visible in dev, hidden in prod). Seeded: `welcome.md` (draft: true).

### Routing / page inventory (generated at build)
- `/` — home (`src/pages/index.astro`)
- `/services` — all-services grid (hand-designed, ported from the designer's original)
- `/services/custom-showers`, `/services/tile-natural-stone`, `/services/hard-surface-flooring` — static per-service pages (hand-designed, ported from the designer's originals; NOT collection-driven)
- `/404` — branded 404

### Unreleased routes (`src/unreleased/` — NOT built)
Parked until there's a release plan; move a folder back under `src/pages/` to ship it:
- `src/unreleased/blog/` → `/blog` + `/blog/[slug]` (blog index + Article JSON-LD detail)
- `src/unreleased/service-areas/` → `/service-areas` + `/service-areas/[location]` (per-city landing pages)
- `src/unreleased/service-location/` → `/services/[service]/[location]` (service × location local-SEO cross-join; uses `ServiceLayout` + the `locations` collection). Note: restoring this route as-is would also re-create dynamic `/services/[service]` handling — it now lives at `src/unreleased/service-location/[location].astro` and expects the `src/pages/services/[service]/` folder structure; re-wire paths when releasing.

The `services`/`locations`/`blog` content collections and `ServiceLayout.astro` remain in place (typed, seeded with Suncoast cities) so releasing is a file move, not a rebuild.

### Home page (`src/pages/index.astro`, ~1174 lines)
One long scroll of anchored sections, each with `id="…"` and `data-nav-theme="light|dark"` (the `#hero` section has `data-nav-theme="dark"` but the navbar stays transparent over it — the theme-switcher special-cases `#hero`):
`hero` (dark), `services` (light), `consultation` (light), `benefits` (light), `about` (light), `process` (light), `gallery` (dark), `before-after` (light), `reviews` (light), `service-area` (dark), `estimate` (dark), `faqs` (light), plus footer (dark).

Page-specific JS (`<script is:inline>`): hero service-word rotator (`#heroRotator`), stat count-up, vertical auto-scrolling gallery wall (`#galleryWall` — home-page build swaps columns 1 and 3 when `n >= 3`), parallax process photos, before/after comparison slider (`#baSlider` — a `.ba` div with pointer-drag + arrow-key/Home/End keyboard control driving CSS `--pos` and `aria-valuenow`), reviews carousel with pagination dots (`.rev-dot`, `.is-active`), dormant partner-logo marquee builder (no `#logoTrack` markup exists — carried over from legacy as a no-op), single-open FAQ accordion (`#faqList`). Header/Footer/EstimateWizard/Lenis/nav-observer/page-transition JS all come from shared components — not duplicated here.

### Page transition (all pages, in `BaseLayout.astro`)
Subtle opacity crossfade on internal navigation: pre-paint flag script in `<head>` adds `html.pt-enter` when the `vlPT` sessionStorage flag is set. Controller `<script is:inline>` right after `<body>` fades `<body>` out on same-origin link clicks then navigates, fades in on arrival. Skips in-page `#anchor` links, new-tab/modified clicks, `prefers-reduced-motion`, and resets on bfcache `pageshow`.

### Service-area map
The home page's `#service-area` section renders a **static image** (`/assets/images/service-area-map.webp`) with an `.area-map-fade` mask/blur edge treatment — there is NO interactive map. Leaflet-related CSS (`#areaMap`, `.svc-tt`, `.area-pin`, …) remains in the page styles as dormant leftovers from an archived interactive version; don't mistake it for a live feature.

### Assets
`public/assets/images/` — `gallery/` (general project photos), `gallery-showers/` (shower project photos), `brand/` (partner wordmarks), `hsf-hardwood.webp`/`hsf-lvp.webp`/`hsf-floor-prep.webp` (real job-site photos for the hard-surface-flooring service page), `favicon.png` (icon + apple-touch-icon on all pages via BaseLayout). Photos are webp; the only deliberate non-webp files are `favicon.png` (Apple touch icons need PNG) and `og-card.jpg` (the 1200×630 branded link-preview card, `defaultOgImage` — FB/WhatsApp previews don't reliably render webp; regenerate via a 1200×630 browser screenshot if branding changes). `public/assets/video/` — `hero-0715.mp4` + `hero-0715.webm`, the active hero `<source>`s. Pre-optimization originals + legacy hero videos live in `_pre-optimize-backup/` at the project root — gitignored, NOT under `public/` (keeping it there shipped ~92MB into every deploy; it was also git-tracked — removed from both). Placeholder images use `https://placehold.co/WIDTHxHEIGHT` until real photos land.

## How to add content

- **New standalone page** (About, Contact, etc.): create `src/pages/about.astro` wrapping `<BaseLayout title="..." description="...">`.
- **New service page**: the live service pages are hand-designed static files — copy an existing one (e.g. `src/pages/services/custom-showers/index.astro`) and adapt. Also add a matching `src/content/services/foo.md` so the parked location cross-join picks it up on release.
- **New city** (only matters once location pages are released): create `src/content/locations/foo.md` → on release generates `/service-areas/foo` + `/services/[every-service]/foo`.
- **New blog post** (only matters once blog is released): create `src/content/blog/foo.md` with `draft: false`.
- **Releasing parked routes**: move the folder from `src/unreleased/` back under `src/pages/` (see "Unreleased routes").

## SEO shipped per page

Live pages:
- Unique `<title>` (brand appended once by SEO.astro unless the title already contains it), meta description (all ≤160 chars, geo-scoped), canonical URL, OG + Twitter Card
- LocalBusiness (GeneralContractor) JSON-LD on every page (via BaseLayout)
- Service + BreadcrumbList JSON-LD on the 3 static service pages (passed via the `schema` prop; `areaServed: "Bradenton–Sarasota, FL"`)
- `@astrojs/sitemap` emits `/sitemap-index.xml` + `/sitemap-0.xml` (5 public URLs; `/404` is noindexed and excluded); `public/robots.txt` points at it

Parked routes additionally emit (on release): FAQPage JSON-LD from `service.data.faqs` (ServiceLayout), Article JSON-LD on blog posts, Place JSON-LD on location landing pages.

## Gotchas
- **Never put `data-nav-theme` on `<body>`** — the navbar theme-switcher picks the first `[data-nav-theme]` element containing its probe point, and body always matches, pinning the navbar to one theme. Sections only.
- `html`/`body` use `overflow-x: clip` — NOT `hidden`. `hidden` turns html/body into a scroll container, which silently breaks `position: sticky` (the home page's overlapping process steps).
- Lenis's anchor-click handler (BaseLayout) explicitly skips `.js-open-estimate` links — the wizard's handler registers later (module script vs inline), so without the skip, CTA clicks would smooth-scroll instead of opening the overlay. Keep that guard if touching the Lenis init. The handler also calls `window.vlCloseMenu()` + `lenis.resize()` (after a double-rAF) before `scrollTo` — with the mobile menu open, the body lock collapses the scrollable height to ~0 and Lenis caches it, so without the close+resize, menu section links close the menu but never scroll.
- `scroll-margin-top: 104px` is set globally in `global.css` on `:where([id])` — keeps anchored sections clear of the fixed floating navbar.
- The page scrollbar is hidden in `global.css`; scrolling still works.
- All interactive states must have hover/focus-visible/active (design rule) and only `transform`/`opacity` are animated — never `transition-all`.
- Don't overwrite `claude-design.md` or `claude-development.md` without being asked.
