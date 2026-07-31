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
 * Blog — long-form content. Uses `render()` on the entry to get the body HTML.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.string().default('VL Construction'),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // If both are set the article page can cross-link back.
    relatedService: z.string().optional(),
    relatedLocation: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, locations, blog };
