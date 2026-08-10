// รูปแบบ {domain}:{id}:{variant} ตาม CLAUDE.md convention
export const cacheKeys = {
  quote: (symbol: string) => `quote:${symbol}`,
  candle: (symbol: string, tf: string) => `candle:${symbol}:${tf}`,
  search: (query: string, type: string) => `search:${query.toLowerCase()}:${type}`,
};
