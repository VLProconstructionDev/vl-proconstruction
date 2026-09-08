import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Services — one file per offering. The slug (file name) becomes the URL:
 *   src/content/services/custom-showers.md → /services/custom-showers
 * Also used to generate service × location SEO pages.
 */
const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    // Short label used in nav/cards.
    shortName: z.string(),
    description: z.string(),
    // SEO overrides — fall back to title/description if omitted.
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    heroImage: z.string().optional(),
    // Feature bullets shown on the service page.
    features: z.array(z.string()).default([]),
    // "Included in your project" cards.
    included: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
          image: z.string().optional(),
        })
      )
      .default([]),
    // FAQ items — used both on the page and for FAQPage JSON-LD.
    faqs: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        })
      )
      .default([]),
    // Display order in the "all services" grid.
    order: z.number().default(0),
    // Set false to keep a page but hide it from listings.
    published: z.boolean().default(true),
  }),
});

/**
 * Locations — one file per city/area. Powers /services/[service]/[location].
 * Populating this is the primary lever for local SEO reach.
 */
const locations = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/locations' }),
  schema: z.object({
    // Human-readable name, e.g. "Bradenton"
    name: z.string(),
    // State postal code, e.g. "FL"
    state: z.string(),
    // County name, e.g. "Washington County"
    county: z.string().optional(),
    // ZIP codes served in this city.
    zips: z.array(z.string()).default([]),
    // Coordinates for JSON-LD + potential map pin.
    lat: z.number(),
    lng: z.number(),
    // Optional per-location neighborhood callouts, landmarks, or drive-time notes
    // that make the page feel locally-written (not templated).
    neighborhoods: z.array(z.string()).default([]),
    intro: z.string().optional(),
    // SEO overrides.
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    heroImage: z.string().optional(),
    order: z.number().default(0),
    published: z.boolean().default(true),
  }),
});

/**
 * City × service pages — /locations/[city]/[service].
 *
 * One file per PAIR, not a blind cross-join: sections 4, 6 and 7 (local
 * expertise, the local project, local reviews) are 100% unique per pair, so a
 * page only exists once someone has written its content. `city` and `service`
 * are ids from the `locations` / `services` collections.
 *
 * The markdown BODY is the "Local expertise" copy (200–300 words).
 */
const cityServices = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/city-services' }),
  schema: z.object({
    city: z.string(),
    service: z.string(),

    // — SEO —
    seoTitle: z.string().optional(),
    seoDescription: z.string(),

    // — 2. Hero —
    // H1 renders as `{heroCity}` / `{heroService}` on two lines.
    heroCity: z.string(),
    heroService: z.string(),
    heroSubhead: z.string(),
    stats: z
      .array(z.object({ count: z.number(), suffix: z.string().default(''), label: z.string() }))
      .default([]),

    // — 3. Trust, 3 cards (card 3 is city-specific) —
    trust: z
      .array(
        z.object({
          icon: z.enum(['check', 'badge', 'crew', 'clock', 'map', 'shield']),
          title: z.string(),
          body: z.string(),
        }),
      )
      .default([]),

    // — 4. Local expertise. The markdown BODY is the intro; the forces that
    //   actually change how the job is built are structured, not prose, so the
    //   page can give each one its own row. —
    localTitle: z.string(),
    localPoints: z
      .array(z.object({ title: z.string(), body: z.string() }))
      .default([]),
    localImage: z.string(),
    localImageAlt: z.string(),

    // — 5. What's included —
    includedTitle: z.string(),
    includedIntro: z.string(),
    included: z
      .array(z.object({ title: z.string(), body: z.string(), image: z.string(), alt: z.string() }))
      .default([]),

    // — 6. A project here —
    project: z.object({
      neighborhood: z.string(),
      year: z.string(),
      timeline: z.string(),
      budget: z.string(),
      story: z.string(),
      image: z.string(),
      imageAlt: z.string(),
    }),

    // — 7. Reviews (this service AND this city) —
    reviews: z
      .array(
        z.object({
          quote: z.string(),
          name: z.string(),
          neighborhood: z.string(),
          avatar: z.string(),
          image: z.string(),
        }),
      )
      .default([]),

    // — 8. Process, 4 steps —
    process: z
      .array(z.object({ title: z.string(), body: z.string(), image: z.string() }))
      .default([]),

    // — 9. Pricing (the same numbers must appear in the FAQ + meta description) —
    // Three tiers, rendered as cards; mark exactly one `featured` for the dark card.
    pricingTitle: z.string(),
    pricingIntro: z.string(),
    pricing: z
      .array(
        z.object({
          eyebrow: z.string(),
          headline: z.string(),
          sub: z.string(),
          features: z.array(z.string()).default([]),
          featured: z.boolean().default(false),
        }),
      )
      .default([]),

    // — 10. Service area —
    areaTitle: z.string(),
    areaBody: z.string(),

    // — 11. FAQ, 5 questions —
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),

    // — 12. CTA + links —
    related: z
      .array(z.object({ label: z.string(), href: z.string(), blurb: z.string() }))
      .default([]),

    published: z.boolean().default(true),
  }),
});

/**
 * Blog — long-form content. Uses `render()` on the entry to get the body HTML.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // Shorter <title> for search results — set it when the h1 runs long.
    seoTitle: z.string().optional(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.string().default('VL Proconstruction'),
    // Author avatar. Falls back to the brand mark on a dark disc (PostMeta).
    authorImage: z.string().optional(),
    heroImage: z.string().optional(),
    // Alt text for the hero image. Falls back to the post title (BlogPostLayout).
    heroImageAlt: z.string().optional(),
    // On-page standfirst under the title. `description` is the meta tag and has
    // to stay under 160 chars for SEO; this is the longer editorial opener and
    // falls back to `description` when unset (BlogPostLayout).
    lede: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // If both are set the article page can cross-link back.
    relatedService: z.string().optional(),
    relatedLocation: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, locations, cityServices, blog };
