// รายชื่อแหล่งข่าว + tier ความน่าเชื่อถือ (docs/03 §4) — RSS URL ทั้งหมดตรวจสอบแล้วว่าดึงได้จริง (2026-08)
export interface NewsSourceConfig {
  domain: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  lang: "en" | "th";
  rssUrl: string;
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  { domain: "wsj.com", name: "The Wall Street Journal", tier: 1, lang: "en", rssUrl: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml" },
  { domain: "cnbc.com", name: "CNBC", tier: 1, lang: "en", rssUrl: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { domain: "marketwatch.com", name: "MarketWatch", tier: 2, lang: "en", rssUrl: "https://feeds.content.dowjones.io/public/rss/mw_topstories" },
  { domain: "finance.yahoo.com", name: "Yahoo Finance", tier: 2, lang: "en", rssUrl: "https://finance.yahoo.com/news/rssindex" },
];
