import { site } from './site';

/** Reusable JSON-LD builders. Return plain objects — SEO.astro serializes them. */

// TODO(after Google Business Profile is set up): enrich with description, email,
// logo, priceRange, sameAs, openingHoursSpecification, hasCredential, and
// aggregateRating — pulling the values from the GBP listing so they match exactly.
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
    url: site.url,
    telephone: site.phoneHref.replace('tel:', ''),
    image: new URL(site.logo, site.url).toString(),
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
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  slug: string;
  areaServed?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    provider: { '@id': `${site.url}/#business` },
    url: `${site.url}/services/${input.slug}`,
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
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    image: input.image
      ? new URL(input.image, site.url).toString()
      : new URL(site.defaultOgImage, site.url).toString(),
    author: {
      '@type': 'Organization',
      name: input.author ?? site.name,
    },
    publisher: { '@id': `${site.url}/#business` },
  };
}
