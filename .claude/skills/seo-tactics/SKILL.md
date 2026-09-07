---
name: seo-tactics
description: Apply and audit VL Proconstruction's SEO playbook — local SEO (city×service pages, GBP, citations), on-page structure (H1/headings, URLs, internal links, alt text), technical SEO (speed, mobile, HTTPS, sitemap), and tracking. Use when creating or reviewing a page for SEO, adding a city×service page, or checking a page against the SEO checklist. For title tags and meta descriptions specifically, use the seo-metadata skill.
---

# SEO tactics

The house SEO playbook, adapted to this Astro static site. Title tags and meta
descriptions have their own rules — defer those to the **seo-metadata** skill.

## Local SEO

### City × service pages
This site already does the core pattern: one page per service × city, built from
`src/content/city-services/*.md` → `/services/[service]/[city]-[state]`. When
adding or reviewing one, confirm the primary keyword (`Service City, ST`) appears in:

- **H1** — the hero heading (`heroCity` + `heroService`).
- **Title tag + meta description** — `seoTitle` / `seoDescription` (see seo-metadata).
- **First paragraph** — the markdown body opener / `heroSubhead`.
- **At least one subheading** — a `localTitle`, `includedTitle`, `pricingTitle`, or `areaTitle`.

Plus:
- **Local section** — name the city, its neighborhoods, and service-area detail
  (`localPoints`, `areaBody`, the city's `neighborhoods` from the locations collection).
- **Map** — the page already renders `<ServiceAreaMap />`; keep it.
- **Linked from nav** — a published pair auto-appears in the Locations nav dropdown
  and the sitemap. A new page must have `published: true` to be discoverable; the
  homepage/services grid should link toward it.
- **URL** — short, keyword-rich, lowercase, hyphens. The route already yields
  `/services/tile-natural-stone/sarasota-fl` — matches the standard; don't override it.

### Google Business Profile (GBP)
Not controlled by this repo, but the site must stay consistent with it:
- **NAP** (Name, Address, Phone) must match GBP and every directory exactly. The
  site's source of truth is `src/lib/site.ts` (`legalName`, `address`, `phone`).
  When GBP is finalized, reconcile `site.ts` + the LocalBusiness JSON-LD
  (`src/lib/schema.ts` has a `TODO(after Google Business Profile is set up)`) and
  the `geo` TODO (real parcel pin, not the ZIP approximation).
- Off-site cadence (post 1–2×/week, reply to all reviews, add photos) is the
  client's job — note it in the client README, don't try to automate it here.

### Local citations
Off-site, client-managed: Google, Yelp, BBB, HomeAdvisor, Houzz, Angi, Chamber of
Commerce, plus industry associations (BIA, HBA). NAP must match `site.ts` exactly
everywhere. Nothing to build in-repo, but flag mismatches if you spot them.

## On-page SEO

### Page structure
- **Exactly one H1 per page**, containing the primary keyword. Audit with the grep below.
- **H2s** for main sections, **H3s** for subsections — real hierarchy, no skipped levels.
- **Title tag / meta description** → seo-metadata skill.
- **URL** — short, keyword-rich, lowercase, hyphen-separated. Astro routing derives
  these from filenames/slugs (`src/lib/urls.ts`); keep slugs clean.

### Content
- Answer the actual search intent for the page's keyword — don't pad.
- Use keywords naturally; never stuff.
- **Internal linking** — link to related service pages and (once live) blog posts.
  City×service pages use the `related` frontmatter array for this.
- **Images** — every `<img>` needs descriptive, keyword-relevant `alt` text (the
  content collections already have `alt` / `imageAlt` fields — fill them, never blank).
  Ship compressed webp (this repo's convention; see CLAUDE.md asset notes).

## Technical SEO
Mostly already handled by the Astro build — verify, don't rebuild:
- **Speed** — check with PageSpeed Insights after major changes. CSS is inlined,
  fonts self-hosted, `/_astro/*` immutably cached (`public/_headers`); keep it that way.
- **Mobile-first** — verify at 375 / 768 / 1440px (project rule).
- **HTTPS** — served by Cloudflare Pages; nothing to do.
- **Sitemap** — `@astrojs/sitemap` emits `/sitemap-index.xml` at build;
  `public/robots.txt` points at it. Submit to Google Search Console once.
- **No broken links / 404s** — after a build, check `dist/` for dead internal links;
  unpublished city×service pairs must not be linked.

## Tracking & measuring (client-side, not in-repo)
- **GSC** — impressions, clicks, average position; review monthly.
- **New page latency** — expect 4–8 weeks before a new page shows in GSC.
- **Rankings** — monthly snapshots in the client Rankings Log.

## Audit checklist (run before shipping an SEO change)

```bash
# 1. Exactly one H1 per built page
for f in $(find dist -name '*.html'); do
  n=$(grep -o '<h1' "$f" | wc -l | tr -d ' ')
  [ "$n" != "1" ] && echo "H1 count $n: $f"
done

# 2. Images missing alt text in content collections
grep -rLn 'alt' src/content 2>/dev/null   # spot-check files with images but no alt

# 3. Title/description lengths → run the seo-metadata audit script
```

Then: `npm run build` (must pass), and eyeball the page at mobile width.
