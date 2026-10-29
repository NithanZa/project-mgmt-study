import type { MetadataRoute } from "next";
import { LESSONS } from "@/content/meta";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    ...LESSONS.map((l) => ({ url: `${SITE_URL}/learn/${l.slug}`, priority: 0.8 })),
  ];
}
