export type AssetClass = "stock" | "etf" | "commodity" | "crypto" | "index" | "fx";

export type MarketState = "open" | "pre" | "post" | "closed" | "holiday";

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "1d" | "1wk" | "1mo";

export type RangeKey = "1d" | "5d" | "1mo" | "6mo" | "ytd" | "1y" | "5y" | "max";

export interface Instrument {
  symbol: string;
  name: string;
  nameTh: string | null;
  assetClass: AssetClass;
  exchange: string | null;
  currency: string;
  logoUrl: string | null;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number | null;
  currency: string;
  marketState: MarketState;
  ts: number; // epoch ms UTC
  delayedMinutes: number;
}

export interface Candle {
  t: number; // epoch ms UTC
  o: number;
  h: number;
  l: number;
  c: number;
  v: number | null;
}
