import type { MetadataRoute } from "next";
import { REPORT, SECTIONS, SITE_URL } from "@/lib/site";

/** Public pages only. /admin stays out: robots.txt already disallows it. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...SECTIONS.map((section) => section.href), REPORT.href];
  return paths.map((path) => ({
    url: path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 0.8 : 0.5,
  }));
}
