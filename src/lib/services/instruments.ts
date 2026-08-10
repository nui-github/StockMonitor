import { ilike, or, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { INSTRUMENT_SEED } from "@/lib/config/instruments-seed";
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

export async function searchInstruments({ query, type, limit }: SearchParams): Promise<Instrument[]> {
  const db = getDb();
  if (!db) return fromSeed(query, type, limit);

  const conditions = [ilike(schema.instruments.symbol, `%${query}%`), ilike(schema.instruments.name, `%${query}%`)];
  const rows = await db
    .select()
    .from(schema.instruments)
    .where(type === "all" ? or(...conditions) : or(...conditions))
    .limit(limit);

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
  if (!seed) return null;
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
