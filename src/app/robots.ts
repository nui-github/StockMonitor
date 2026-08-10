import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/account/"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
