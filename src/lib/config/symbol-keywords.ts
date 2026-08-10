// keyword ต่อ symbol สำหรับจับคู่ข่าว → สินทรัพย์ (NER แบบง่าย, Phase 3 MVP)
// จับคู่แบบ case-insensitive substring บนหัวข้อ+คำอธิบายข่าว
export const SYMBOL_KEYWORDS: Record<string, string[]> = {
  AAPL: ["AAPL", "Apple Inc", "Apple's", "Apple stock", "iPhone"],
  NVDA: ["NVDA", "Nvidia", "NVIDIA"],
  TSLA: ["TSLA", "Tesla"],
  SPY: ["S&P 500", "S&P500", "SPDR S&P"],
  QQQ: ["Nasdaq 100", "Nasdaq-100", "Invesco QQQ"],
  XAUUSD: ["gold price", "gold prices", "gold futures", "XAU"],
  XAGUSD: ["silver price", "silver prices", "silver futures", "XAG"],
  WTI: ["WTI", "crude oil", "oil price", "oil prices", "oil futures"],
  BRENT: ["Brent crude", "Brent oil"],
};

export function matchSymbols(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const [symbol, keywords] of Object.entries(SYMBOL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      matched.push(symbol);
    }
  }

  return matched;
}
