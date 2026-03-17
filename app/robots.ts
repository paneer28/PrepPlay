import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/practice", "/deca-roleplay-practice", "/about", "/login"],
      disallow: ["/account", "/api/"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
