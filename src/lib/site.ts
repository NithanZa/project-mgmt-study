/**
 * The course lives at nithan.link/project-mgmt-study: the nithan-link site proxies that path to
 * this Vercel project, so every route and asset is built under it.
 */
export const BASE_PATH = "/project-mgmt-study";

/**
 * NEXT_PUBLIC_SITE_URL (an origin) wins; Vercel builds use nithan.link, where the course is public.
 * This is metadataBase: Next adds the base path to the metadata URLs it resolves against it.
 */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL ? "https://nithan.link" : "http://localhost:3000");

/** The course's public home, for canonical URLs and the sitemap. */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;
