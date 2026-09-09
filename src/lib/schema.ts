import { site } from './site';

/** Reusable JSON-LD builders. Return plain objects — SEO.astro serializes them. */

// TODO(after Google Business Profile is set up): add openingHoursSpecification and
// hasCredential (license number), pulling the values from the GBP listing so they
// match exactly. aggregateRating is deliberately NOT emitted: the reviews shown on
// this site are the business's own, and Google treats self-serving LocalBusiness
// review markup as ineligible for rich results.
export function localBusinessSchema() {
  // Omit address fields that are still empty rather than emitting "".
  const address = Object.fromEntries(
    Object.entries(site.address).filter(([, v]) => v !== ''),
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': `${site.url}/#business`,
    name: site.legalName,
    alternateName: site.name,
    description: site.tagline,
    url: site.url,
    telephone: site.phoneHref.replace('tel:', ''),
    email: site.email,
    image: new URL(site.defaultOgImage, site.url).toString(),
    logo: new URL(site.logo, site.url).toString(),
    priceRange: '$$',
    currenciesAccepted: 'USD',
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      ...site.geo,
    },
    areaServed: site.areaServed.map((name) => ({
      '@type': 'AdministrativeArea',
      name,
    })),
    sameAs: Object.values(site.social).filter(Boolean),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Construction services',
      itemListElement: SERVICE_CATALOG.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          url: new URL(`/services/${s.slug}`, site.url).toString(),
        },
      })),
    },
  };
}

/** The three live service pages — the catalog the business actually offers. */
const SERVICE_CATALOG = [
  { slug: 'custom-showers', name: 'Custom Shower Installation' },
  { slug: 'tile-natural-stone', name: 'Tile & Natural Stone Installation' },
  { slug: 'flooring', name: 'Hard-Surface Flooring Installation' },
];

/** WebSite node — names the site for Google and links it back to the business. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: site.url,
    inLanguage: 'en-US',
    publisher: { '@id': `${site.url}/#business` },
  };
}

/** FAQPage — only ever from Q&As that are visible on the page itself. */
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

/** ItemList — an ordered list of linked pages (e.g. the services index). */
export function itemListSchema(input: {
  name: string;
  items: { name: string; url: string; description?: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    itemListElement: input.items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: new URL(item.url, site.url).toString(),
    })),
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  slug: string;
  areaServed?: string;
  /** Override when the Service lives at its own URL (e.g. a city × service page). */
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    provider: { '@id': `${site.url}/#business` },
    url: new URL(input.url ?? `/services/${input.slug}`, site.url).toString(),
    ...(input.areaServed && {
      areaServed: { '@type': 'Place', name: input.areaServed },
    }),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.url, site.url).toString(),
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: `${site.url}/blog/${input.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${site.url}/blog/${input.slug}`,
    },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    image: input.image
      ? new URL(input.image, site.url).toString()
      : new URL(site.defaultOgImage, site.url).toString(),
    // A named person authors the post; a post credited to the company itself
    // stays an Organization so the type always matches the byline.
    author:
      !input.author || input.author === site.name || input.author === site.legalName
        ? { '@type': 'Organization', name: input.author ?? site.name }
        : {
            '@type': 'Person',
            name: input.author,
            worksFor: { '@id': `${site.url}/#business` },
          },
    publisher: { '@id': `${site.url}/#business` },
  };
}
