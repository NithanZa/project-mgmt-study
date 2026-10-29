const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

/** NEXT_PUBLIC_SITE_URL wins; Vercel builds fall back to the project's production domain. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? (vercel ? `https://${vercel}` : "http://localhost:3000");
