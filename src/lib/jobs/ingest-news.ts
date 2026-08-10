import Parser from "rss-parser";
import { getDb, schema } from "@/lib/db";
import { NEWS_SOURCES } from "@/lib/config/sources";
import { matchSymbols } from "@/lib/config/symbol-keywords";
import { sha256Hex, simhash32 } from "@/lib/utils/hash";

const parser = new Parser({ timeout: 10_000 });

export interface IngestStats {
  sourcesOk: number;
  sourcesFailed: number;
  itemsSeen: number;
  articlesInserted: number;
  linksInserted: number;
}

/** ดึง RSS ทุกแหล่งใน NEWS_SOURCES → dedupe ด้วย url_hash → map เข้า symbol ด้วย keyword matching (docs/03 §7, ไม่แตะ AI เลย) */
export async function ingestNews(): Promise<IngestStats> {
  const db = getDb();
  const stats: IngestStats = { sourcesOk: 0, sourcesFailed: 0, itemsSeen: 0, articlesInserted: 0, linksInserted: 0 };

  if (!db) return stats;

  // upsert แหล่งข่าวก่อน (FK ของ news_articles.domain ต้องมี row นี้อยู่แล้ว)
  await db
    .insert(schema.newsSources)
    .values(NEWS_SOURCES.map((s) => ({ domain: s.domain, name: s.name, tier: s.tier, lang: s.lang, rssUrl: s.rssUrl })))
    .onConflictDoNothing();

  for (const source of NEWS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.rssUrl);

      for (const item of feed.items) {
        stats.itemsSeen++;
        if (!item.link || !item.title) continue;

        const publishedAt = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date();
        const text = `${item.title} ${item.contentSnippet ?? item.content ?? ""}`;

        const inserted = await db
          .insert(schema.newsArticles)
          .values({
            urlHash: sha256Hex(item.link),
            simhash: simhash32(text),
            url: item.link,
            domain: source.domain,
            title: item.title,
            publishedAt,
          })
          .onConflictDoNothing({ target: schema.newsArticles.urlHash })
          .returning({ id: schema.newsArticles.id });

        if (inserted.length === 0) continue; // มีอยู่แล้ว (url ซ้ำ)
        stats.articlesInserted++;

        const symbols = matchSymbols(text);
        if (symbols.length === 0) continue;

        await db
          .insert(schema.articleInstrument)
          .values(symbols.map((symbol) => ({ articleId: inserted[0].id, symbol })))
          .onConflictDoNothing();
        stats.linksInserted += symbols.length;
      }

      stats.sourcesOk++;
    } catch {
      stats.sourcesFailed++;
    }
  }

  return stats;
}
