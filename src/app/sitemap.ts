import type { MetadataRoute } from "next";
import { listAllInstruments } from "@/lib/services/instruments";
import { getSiteUrl } from "@/lib/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const instruments = await listAllInstruments();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/markets`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const symbolRoutes: MetadataRoute.Sitemap = instruments.map((i) => ({
    url: `${baseUrl}/s/${i.symbol}`,
    changeFrequency: "hourly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...symbolRoutes];
}
