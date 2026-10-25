import { isPlaceholder, PLACEHOLDER_RE, type Book, type Resource, type Testimonial, type Trip } from "./schema";

type Mode = "preview" | "live";

/** Testimonials appear only when the school confirmed they are authentic and chose to publish them. */
export function visibleTestimonials(items: Testimonial[], _mode: Mode): Testimonial[] {
  return items.filter((q) => q.published && q.authentic && !isPlaceholder(q.quote.it) && q.author.trim());
}

/** In live mode a trip with placeholders left in title/destination/dates is hidden. */
export function visibleTrips(items: Trip[], mode: Mode): Trip[] {
  return items.filter((trip) => {
    if (!trip.published) return false;
    if (mode === "preview") return true;
    return ![trip.title.it, trip.destination.it, trip.dates.it].some((v) => PLACEHOLDER_RE.test(v) || !v.trim());
  });
}

export function visibleResources(items: Resource[]): Resource[] {
  return items.filter((r) => r.published && /^https?:\/\//.test(r.url) && r.title.it.trim());
}

/** Only links provided by Backstage to Amazon domains. */
export function isAmazonUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /(^|\.)amazon\.(it|com|co\.uk|de|fr|es|nl|ie|ca|com\.au)$/.test(host) || host === "amzn.to" || host === "amzn.eu";
  } catch {
    return false;
  }
}

export function visibleBooks(items: Book[]): Book[] {
  return items.filter((b) => b.published && b.title.trim() && isAmazonUrl(b.amazonUrl));
}
