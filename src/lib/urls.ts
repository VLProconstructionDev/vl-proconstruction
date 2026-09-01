import type { CollectionEntry } from 'astro:content';

/**
 * URL slug for a location: the collection id plus the state, e.g.
 * `bradenton` + `FL` → `bradenton-fl`. Used by the city × service route
 * (`/services/[service]/[location]`) and everything that links to it, so the
 * slug is defined in exactly one place.
 */
export function locationSlug(location: CollectionEntry<'locations'>): string {
  return `${location.id}-${location.data.state.toLowerCase()}`;
}

/** Canonical path for a city × service page. */
export function cityServicePath(
  location: CollectionEntry<'locations'>,
  serviceId: string,
): string {
  return `/services/${serviceId}/${locationSlug(location)}`;
}
