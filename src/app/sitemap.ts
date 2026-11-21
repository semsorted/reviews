import type { MetadataRoute } from "next";
import { STORIES } from "@/app/_landing/content";
import { NAV_LINKS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-21");
  return [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    ...NAV_LINKS.map(({ href }) => ({ url: `${SITE_URL}${href}`, lastModified, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...STORIES.map(({ slug }) => ({ url: `${SITE_URL}/stories/${slug}`, lastModified, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
