import type { MetadataRoute } from "next";

/**
 * Public notes are indexable. `/admin` is the team desk: a crawler that reaches
 * it is redirected to the login, or refused by Cloudflare Access with 401.
 * Disallowing it here is what keeps that URL out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
  };
}
