---
name: seo-metadata
description: Write and audit SEO title tags and meta descriptions for VL Proconstruction pages. Use when adding or editing a page's seoTitle/seoDescription, a new service or city×service content file, or when the user asks to check/fix titles and descriptions for SEO.
---

# SEO metadata rules

Every indexable page needs a title tag and meta description that follow these
rules. For the broader SEO playbook (city pages, headings, internal links,
technical, tracking), see the **seo-tactics** skill — this skill owns titles and
descriptions only.

## The rules

- **Title tag** — format `Primary Keyword | Brand Name`, **under 60 characters** (the full rendered tag, brand included).
- **Meta description** — compelling, includes the primary keyword, **under 160 characters**.

## How this project renders titles (important)

`src/components/SEO.astro` builds the final `<title>` as:

```
fullTitle = title.includes("VL Proconstruction") ? title : `${title} | VL Proconstruction`
```

So the content field (`seoTitle` in `src/content/**/*.md`, or the `title` prop on a page) is the **Primary Keyword** half only — the brand is appended automatically.

- ` | VL Proconstruction` = **21 characters**.
- Therefore `seoTitle` must be **≤ 39 characters** so the rendered tag stays under 60.
- Do **not** hand-write the brand into `seoTitle` (it would double up or blow the budget). Only add it manually if a page needs a *different* trailing phrase and you've confirmed the total.

`seoDescription` is passed straight through to `<meta name="description">` — no transformation — so its own length must be under 160.

## Writing a good title

- Lead with the primary keyword users actually search: `Service City, FL` for local pages (`Custom Showers Sarasota, FL`), `Service` for the service-index pages (`Custom Shower Installation`).
- No filler tails (`— Built to Last`, `— Curbless, Waterproofed`). They push past 60 and get truncated in the SERP.
- Keep the city + state for every city×service page — that's the ranking target.

## Writing a good description

- One or two sentences, active voice, aimed at the searcher.
- Include the primary keyword (service + city) in the first clause.
- Concrete specifics beat adjectives: materials, a price range, "Free estimate."
- Use `& ` over `and`, and `$9–$26/sq ft` over `Most X floors run $9–$26/sq ft` when trimming for length.

## Where these live

- `src/content/services/*.md` — service-index pages (`seoTitle`, `seoDescription`).
- `src/content/city-services/*.md` — city × service local-SEO pages (`seoTitle`, `seoDescription`).
- Hand-designed pages set `title`/`description` props on `BaseLayout` directly.

## Audit checklist

Run this to catch any over-length metadata before committing:

```bash
python3 - <<'PY'
import glob, re
BRAND=" | VL Proconstruction"
def folded(t): return re.sub(r'\s+',' ',t).strip()
for f in sorted(glob.glob("src/content/**/*.md", recursive=True)):
    s=open(f,encoding="utf-8").read()
    mt=re.search(r'^seoTitle:\s*(.+)$', s, re.M)
    md=re.search(r'^seoDescription:\s*(?:>-?\s*)?\n((?:[ ].*\n)+)|^seoDescription:\s*"?(.+?)"?\s*$', s, re.M)
    if mt:
        t=mt.group(1).strip().strip('"')
        full=t if "VL Proconstruction" in t else t+BRAND
        if len(full)>60: print(f"TITLE {len(full)} {f}: {full}")
    if md:
        d=folded(md.group(1)) if md.group(1) else md.group(2).strip()
        if len(d)>160: print(f"DESC  {len(d)} {f}")
PY
```

No output = everything passes. Then run `npm run build` to confirm content still validates.
