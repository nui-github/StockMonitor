import type { AssetClass } from "@/types/market";

export interface InstrumentSeed {
  symbol: string;
  name: string;
  nameTh: string;
  assetClass: AssetClass;
  exchange: string | null;
  currency: string;
}

// ชุดข้อมูลเริ่มต้น — ใช้ทั้งเป็น fallback ตอนยังไม่ต่อ DB และเป็น seed data ตอนมี DB จริง (docs/09 Phase 0)
export const INSTRUMENT_SEED: InstrumentSeed[] = [
  { symbol: "AAPL", name: "Apple Inc.", nameTh: "แอปเปิล", assetClass: "stock", exchange: "NASDAQ", currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corp.", nameTh: "เอ็นวิเดีย", assetClass: "stock", exchange: "NASDAQ", currency: "USD" },
  { symbol: "TSLA", name: "Tesla Inc.", nameTh: "เทสลา", assetClass: "stock", exchange: "NASDAQ", currency: "USD" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", nameTh: "SPDR S&P 500 ETF", assetClass: "etf", exchange: "NYSEARCA", currency: "USD" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", nameTh: "Invesco QQQ Trust", assetClass: "etf", exchange: "NASDAQ", currency: "USD" },
  { symbol: "XAUUSD", name: "Gold Spot", nameTh: "ทองคำ (Spot Gold)", assetClass: "commodity", exchange: null, currency: "USD" },
  { symbol: "XAGUSD", name: "Silver Spot", nameTh: "เงิน (Spot Silver)", assetClass: "commodity", exchange: null, currency: "USD" },
  { symbol: "WTI", name: "Crude Oil WTI", nameTh: "น้ำมัน WTI", assetClass: "commodity", exchange: null, currency: "USD" },
  { symbol: "BRENT", name: "Crude Oil Brent", nameTh: "น้ำมัน Brent", assetClass: "commodity", exchange: null, currency: "USD" },
];
