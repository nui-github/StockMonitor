import { ilike, or, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { INSTRUMENT_SEED } from "@/lib/config/instruments-seed";
import { getRedis } from "@/lib/cache/redis";
import { cacheKeys } from "@/lib/cache/keys";
import { CACHE_TTL_SECONDS } from "@/lib/cache/ttl";
import { getProfileFromRegistry, searchSymbolsFromRegistry } from "@/lib/providers/registry";
import type { AssetClass, Instrument } from "@/types/market";

export interface SearchParams {
  query: string;
  type: AssetClass | "all";
  limit: number;
}

function fromSeed(query: string, type: AssetClass | "all", limit: number): Instrument[] {
  const q = query.toLowerCase();
  return INSTRUMENT_SEED.filter((i) => {
    const matchesType = type === "all" || i.assetClass === type;
    const matchesQuery = i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
    return matchesType && matchesQuery;
  })
    .slice(0, limit)
    .map((i) => ({
      symbol: i.symbol,
      name: i.name,
      nameTh: i.nameTh,
      assetClass: i.assetClass,
      exchange: i.exchange,
      currency: i.currency,
      logoUrl: null,
    }));
}

async function searchLocal(query: string, type: AssetClass | "all", limit: number): Promise<Instrument[]> {
  const db = getDb();
  if (!db) return fromSeed(query, type, limit);

  const conditions = [ilike(schema.instruments.symbol, `%${query}%`), ilike(schema.instruments.name, `%${query}%`)];
  const rows = await db.select().from(schema.instruments).where(or(...conditions)).limit(limit);
  const filtered = type === "all" ? rows : rows.filter((r) => r.assetClass === type);

  return filtered.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    nameTh: r.nameTh,
    assetClass: r.assetClass as AssetClass,
    exchange: r.exchange,
    currency: r.currency,
    logoUrl: r.logoUrl,
  }));
}

/**
 * ค้นในฐานข้อมูลเราก่อน (ได้ชื่อไทย + logo) แล้วเติมด้วยผลจาก provider
 * ไม่ทำแบบหลังอย่างเดียวเพราะจะเสียชื่อไทยที่ seed ไว้ และ commodity (ทอง/น้ำมัน) ไม่มีใน finnhub search
 */
export async function searchInstruments({ query, type, limit }: SearchParams): Promise<Instrument[]> {
  const local = await searchLocal(query, type, limit);
  if (local.length >= limit || query.trim().length === 0) return local;

  const redis = getRedis();
  const cacheKey = cacheKeys.search(query, type);

  let remote: Instrument[] | null = null;
  if (redis) remote = await redis.get<Instrument[]>(cacheKey);

  if (!remote) {
    const res = await searchSymbolsFromRegistry(query);
    // provider ล่ม/ไม่ได้ตั้ง key ไม่ควรทำให้ผลค้นในบ้านเราหายไปด้วย — คืนเท่าที่มี
    if (!res.ok) return local;

    remote = res.value.map((hit) => ({
      symbol: hit.symbol,
      name: hit.name,
      nameTh: null,
      assetClass: hit.assetClass,
      exchange: null,
      currency: "USD",
      logoUrl: null,
    }));

    if (redis) await redis.set(cacheKey, remote, { ex: CACHE_TTL_SECONDS.search });
  }

  const seen = new Set(local.map((i) => i.symbol));
  const merged = [...local];
  for (const hit of remote) {
    if (seen.has(hit.symbol)) continue;
    if (type !== "all" && hit.assetClass !== type) continue;
    merged.push(hit);
    if (merged.length >= limit) break;
  }

  return merged;
}

export async function listAllInstruments(): Promise<Instrument[]> {
  const db = getDb();
  if (!db) return fromSeed("", "all", INSTRUMENT_SEED.length);

  const rows = await db.select().from(schema.instruments);
  return rows.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    nameTh: r.nameTh,
    assetClass: r.assetClass as AssetClass,
    exchange: r.exchange,
    currency: r.currency,
    logoUrl: r.logoUrl,
  }));
}

export async function getInstrument(symbol: string): Promise<Instrument | null> {
  const db = getDb();
  const upper = symbol.toUpperCase();

  if (db) {
    const rows = await db.select().from(schema.instruments).where(eq(schema.instruments.symbol, upper)).limit(1);
    if (rows[0]) {
      const r = rows[0];
      return {
        symbol: r.symbol,
        name: r.name,
        nameTh: r.nameTh,
        assetClass: r.assetClass as AssetClass,
        exchange: r.exchange,
        currency: r.currency,
        logoUrl: r.logoUrl,
      };
    }
  }

  const seed = INSTRUMENT_SEED.find((i) => i.symbol === upper);
  if (seed) {
    return {
      symbol: seed.symbol,
      name: seed.name,
      nameTh: seed.nameTh,
      assetClass: seed.assetClass,
      exchange: seed.exchange,
      currency: seed.currency,
      logoUrl: null,
    };
  }

  // ไม่รู้จัก — ถาม provider แล้วบันทึกลง instruments
  // ต้องบันทึกจริง ไม่ใช่คืนค่าลอย ๆ เพราะ watchlist/alerts/portfolio มี FK ไป instruments.symbol
  // ถ้าไม่มีแถวนี้ ผู้ใช้จะเปิดหน้าดูราคาได้แต่กด "เพิ่มเข้า watchlist" แล้ว FK พัง
  const profileRes = await getProfileFromRegistry(upper);
  if (!profileRes.ok) return null;
  const profile = profileRes.value;

  if (db) {
    await db
      .insert(schema.instruments)
      .values({
        symbol: profile.symbol,
        name: profile.name,
        assetClass: profile.assetClass,
        exchange: profile.exchange,
        currency: profile.currency,
        logoUrl: profile.logoUrl,
      })
      .onConflictDoNothing();
  }

  return {
    symbol: profile.symbol,
    name: profile.name,
    nameTh: null,
    assetClass: profile.assetClass,
    exchange: profile.exchange,
    currency: profile.currency,
    logoUrl: profile.logoUrl,
  };
}
