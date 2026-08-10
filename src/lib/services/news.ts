import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface NewsItem {
  id: string;
  title: string;
  titleTh: string | null;
  url: string;
  source: { name: string; domain: string; tier: number };
  publishedAt: number;
  summaryTh: string | null;
  sentiment: number | null;
}

export interface NewsQuery {
  symbol: string;
  limit: number;
  minTier: number;
  sinceMs?: number;
}

export async function getNewsForSymbol({ symbol, limit, minTier, sinceMs }: NewsQuery): Promise<NewsItem[]> {
  const db = getDb();
  if (!db) return [];

  const tiers = [1, 2, 3, 4].filter((t) => t <= minTier);

  const rows = await db
    .select({
      id: schema.newsArticles.id,
      title: schema.newsArticles.title,
      titleTh: schema.newsArticles.titleTh,
      url: schema.newsArticles.url,
      publishedAt: schema.newsArticles.publishedAt,
      summaryTh: schema.newsArticles.summaryTh,
      sentiment: schema.newsArticles.sentiment,
      sourceName: schema.newsSources.name,
      sourceDomain: schema.newsSources.domain,
      sourceTier: schema.newsSources.tier,
    })
    .from(schema.articleInstrument)
    .innerJoin(schema.newsArticles, eq(schema.articleInstrument.articleId, schema.newsArticles.id))
    .innerJoin(schema.newsSources, eq(schema.newsArticles.domain, schema.newsSources.domain))
    .where(
      and(
        eq(schema.articleInstrument.symbol, symbol.toUpperCase()),
        inArray(schema.newsSources.tier, tiers),
        sinceMs ? gte(schema.newsArticles.publishedAt, new Date(sinceMs)) : undefined,
      ),
    )
    .orderBy(desc(schema.newsArticles.publishedAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    titleTh: r.titleTh,
    url: r.url,
    source: { name: r.sourceName, domain: r.sourceDomain, tier: r.sourceTier },
    publishedAt: r.publishedAt.getTime(),
    summaryTh: r.summaryTh,
    sentiment: r.sentiment,
  }));
}
