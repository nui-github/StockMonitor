// เฉพาะ lib/providers/* — ห้าม import React (CLAUDE.md ข้อ 1)
import { z } from "zod";
import { env } from "@/lib/config/env";
import { err, ok, type Result } from "@/lib/utils/result";
import type { AssetClass, MarketState, Quote } from "@/types/market";
import { fetchJson } from "./http";
import { lookupSymbol } from "./symbol-map";
import type { InstrumentProfile, ProviderError, QuoteProvider, SearchProvider, SymbolHit } from "./types";
import { getMarketState } from "@/lib/config/markets";

const FinnhubQuoteSchema = z.object({
  c: z.number(), // current price
  d: z.number().nullable(), // change
  dp: z.number().nullable(), // percent change
  h: z.number(), // high
  l: z.number(), // low
  o: z.number(), // open
  pc: z.number(), // previous close
  t: z.number(), // epoch seconds
});

const FinnhubSearchSchema = z.object({
  count: z.number(),
  result: z.array(
    z.object({
      symbol: z.string(),
      displaySymbol: z.string(),
      description: z.string(),
      type: z.string(),
    }),
  ),
});

const FinnhubProfileSchema = z.object({
  ticker: z.string().optional(),
  name: z.string().optional(),
  currency: z.string().optional(),
  exchange: z.string().optional(),
  logo: z.string().optional(),
});

const PROVIDER_ID = "finnhub";

// finnhub `type` เป็น free text ไม่ใช่ enum — คำที่เจอจริงคือ "Common Stock", "ETP", "ETF", "REIT", "ADR" ฯลฯ
// map เข้าเฉพาะ stock/etf ที่เรารองรับ ตัวอื่นคืน null แล้วกรองทิ้ง (ดีกว่าเดาผิดแล้วส่ง symbol ที่ดึงราคาไม่ได้ให้ผู้ใช้)
function mapAssetClass(type: string): AssetClass | null {
  const t = type.toLowerCase();
  if (t.includes("etf") || t.includes("etp") || t.includes("fund")) return "etf";
  if (t.includes("stock") || t.includes("adr") || t.includes("reit") || t.includes("share")) return "stock";
  return null;
}

// finnhub คืนชื่อตลาดแบบยาว ("NASDAQ NMS - GLOBAL MARKET") แต่คอลัมน์ exchange เป็น varchar(24) และ seed
// ใช้โค้ดสั้น ("NASDAQ", "NYSEARCA") — ไม่ย่อ = insert ล้นคอลัมน์ error 22001 และข้อมูลไม่เข้ากับของเดิม
function normalizeExchange(raw: string | undefined): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper.includes("NASDAQ")) return "NASDAQ";
  if (upper.includes("ARCA")) return "NYSEARCA";
  if (upper.includes("BATS") || upper.includes("CBOE")) return "CBOE";
  if (upper.includes("AMERICAN")) return "NYSEAMERICAN";
  if (upper.includes("NEW YORK") || upper.includes("NYSE")) return "NYSE";
  return upper.slice(0, 24); // ตลาดที่ยังไม่รู้จัก เก็บเท่าที่คอลัมน์รับได้ ดีกว่า insert พัง
}

function notConfigured(): ProviderError {
  return { code: "NOT_CONFIGURED", message: "FINNHUB_API_KEY is not set", provider: PROVIDER_ID, retryable: false };
}

function unsupported(symbol: string): ProviderError {
  return {
    code: "NOT_SUPPORTED",
    message: `finnhub does not support symbol ${symbol}`,
    provider: PROVIDER_ID,
    retryable: false,
  };
}

export const finnhubProvider: QuoteProvider = {
  id: PROVIDER_ID,

  supports(assetClass: AssetClass) {
    return assetClass === "stock" || assetClass === "etf";
  },

  async getQuote(symbol: string): Promise<Result<Quote, ProviderError>> {
    if (!env.FINNHUB_API_KEY) return err(notConfigured());

    const info = lookupSymbol(symbol);
    if (!info?.finnhub || !this.supports(info.assetClass)) {
      return err(unsupported(symbol));
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(info.finnhub)}&token=${env.FINNHUB_API_KEY}`;
    const res = await fetchJson(url, { provider: PROVIDER_ID });
    if (!res.ok) return err(res.error);

    const parsed = FinnhubQuoteSchema.safeParse(res.value);
    if (!parsed.success) {
      return err({
        code: "INVALID_RESPONSE",
        message: `finnhub quote response did not match schema: ${parsed.error.message}`,
        provider: PROVIDER_ID,
        retryable: false,
      });
    }

    // finnhub คืนค่า 0 ทุก field เมื่อ symbol ไม่รู้จัก (ไม่ error, ไม่ throw)
    if (parsed.data.c === 0 && parsed.data.pc === 0) {
      return err(unsupported(symbol));
    }

    const marketState: MarketState = getMarketState(info.assetClass, new Date());

    return ok({
      symbol,
      price: parsed.data.c,
      change: parsed.data.d ?? parsed.data.c - parsed.data.pc,
      changePct: parsed.data.dp ?? ((parsed.data.c - parsed.data.pc) / parsed.data.pc) * 100,
      open: parsed.data.o,
      high: parsed.data.h,
      low: parsed.data.l,
      prevClose: parsed.data.pc,
      volume: null, // free tier /quote ไม่คืน volume
      currency: info.currency,
      marketState,
      ts: parsed.data.t * 1000,
      delayedMinutes: 0,
    });
  },
};

export const finnhubSearchProvider: SearchProvider = {
  id: PROVIDER_ID,

  async searchSymbols(query: string): Promise<Result<SymbolHit[], ProviderError>> {
    if (!env.FINNHUB_API_KEY) return err(notConfigured());

    // จำกัด exchange=US เพราะ free tier ให้ราคาเฉพาะตลาดสหรัฐ — ถ้าไม่จำกัด ผู้ใช้จะเจอ symbol
    // ต่างประเทศที่กดเข้าไปแล้วไม่มีราคาให้ดู
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&exchange=US&token=${env.FINNHUB_API_KEY}`;
    const res = await fetchJson(url, { provider: PROVIDER_ID });
    if (!res.ok) return err(res.error);

    const parsed = FinnhubSearchSchema.safeParse(res.value);
    if (!parsed.success) {
      return err({
        code: "INVALID_RESPONSE",
        message: `finnhub search response did not match schema: ${parsed.error.message}`,
        provider: PROVIDER_ID,
        retryable: false,
      });
    }

    const hits: SymbolHit[] = [];
    for (const row of parsed.data.result) {
      const assetClass = mapAssetClass(row.type);
      if (!assetClass) continue;
      // ข้าม symbol ที่มีจุด/ขีด (เช่น BRK.A, ADRs บางตัว) — finnhub /quote ส่วนใหญ่ไม่คืนราคาให้
      if (!/^[A-Z]{1,6}$/.test(row.symbol)) continue;
      hits.push({ symbol: row.symbol, name: row.description, assetClass });
    }

    return ok(hits);
  },

  async getProfile(symbol: string): Promise<Result<InstrumentProfile, ProviderError>> {
    if (!env.FINNHUB_API_KEY) return err(notConfigured());

    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${env.FINNHUB_API_KEY}`;
    const res = await fetchJson(url, { provider: PROVIDER_ID });
    if (!res.ok) return err(res.error);

    const parsed = FinnhubProfileSchema.safeParse(res.value);
    if (!parsed.success) {
      return err({
        code: "INVALID_RESPONSE",
        message: `finnhub profile response did not match schema: ${parsed.error.message}`,
        provider: PROVIDER_ID,
        retryable: false,
      });
    }

    // symbol ที่ไม่รู้จัก finnhub คืน {} ว่าง ๆ (200 ไม่ error) — ไม่มี name แปลว่าไม่มีจริง
    if (!parsed.data.name || !parsed.data.ticker) return err(unsupported(symbol));

    return ok({
      symbol: parsed.data.ticker.toUpperCase(),
      name: parsed.data.name,
      // profile2 ไม่บอกว่าเป็น ETF หรือหุ้น — เดาเป็น stock ไว้ก่อน ตัวที่มาจาก search จะมี assetClass ที่ถูกกว่าอยู่แล้ว
      assetClass: "stock",
      exchange: normalizeExchange(parsed.data.exchange),
      currency: parsed.data.currency ?? "USD",
      logoUrl: parsed.data.logo || null,
    });
  },
};
