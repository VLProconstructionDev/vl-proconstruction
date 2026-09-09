/**
 * Google reviews + the aggregate rating, shared by every `#reviews` section.
 *
 * `googleReviews` is the default set used on the home page, the services index
 * and the three static service pages — one array so those lists cannot drift.
 * City × service pages pass their own city-scoped reviews (from the
 * `cityServices` collection) into <ReviewsSection /> instead.
 */
export interface Review {
  /** Review body, verbatim from Google. */
  quote: string;
  /** Reviewer name as it appears on the review. */
  name: string;
  /**
   * Small line in the card's bottom-right — the neighborhood on city pages.
   * Omit rather than guess; the card drops the row when it's empty.
   */
  meta?: string;
}

export const googleReviews: Review[] = [
  {
    name: 'Paul Lipowicz',
    quote:
      'Abel and his brothers are top notch installers. I have been in the industry for 20 years and know great installers when I see them. I hired them to do a marble backsplash for me and they were extremely clean, calculated, presentable, and meticulous. They do things right the first time and take pride in their knowledge and work. Definitely will be using them again soon on other properties!',
  },
  {
    name: 'Valeriy Tsinovkin',
    quote:
      "I recently had my kitchen remodeled and couldn't be happier with the results. The entire process was smooth and professional, and the team kept everything clean and organized throughout the project. The craftsmanship and attention to detail were excellent, and my kitchen looks stunning. Highly recommend to anyone looking for a high-quality, hassle-free remodel.",
  },
  {
    name: 'Avetal Mor',
    quote: 'Absolutely amazing work fixed our floors after hurricane!',
  },
  {
    name: 'Stacy Ramirez',
    quote:
      "Vlad and his team are phenomenal! We couldn't be happier with our new master bath. Their attention to detail is unmatched. They showed up, communicated well, and offered quality suggestions. We highly recommend and will use them for our next home project.",
  },
];

/**
 * Aggregate rating shown in the trust panel. Matches the claim the hero trust
 * pill already makes site-wide ("Rated 5/5 by 100+ Customers").
 *
 * TODO: replace `count` with the exact Google review count once the Google
 * Business Profile is set up, then this can also feed AggregateRating JSON-LD
 * (schema.org needs a real integer, so "100+" deliberately stays out of it).
 */
export const rating = {
  score: '5.0',
  best: '5',
  count: '100+',
};
