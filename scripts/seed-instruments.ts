import { getDb, schema } from "@/lib/db";
import { INSTRUMENT_SEED } from "@/lib/config/instruments-seed";

async function main() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL is not set — ตั้งค่าใน .env.local ก่อนรัน seed");
    process.exit(1);
  }

  for (const instrument of INSTRUMENT_SEED) {
    await db
      .insert(schema.instruments)
      .values({
        symbol: instrument.symbol,
        name: instrument.name,
        nameTh: instrument.nameTh,
        assetClass: instrument.assetClass,
        exchange: instrument.exchange,
        currency: instrument.currency,
      })
      .onConflictDoUpdate({
        target: schema.instruments.symbol,
        set: {
          name: instrument.name,
          nameTh: instrument.nameTh,
          assetClass: instrument.assetClass,
          exchange: instrument.exchange,
          currency: instrument.currency,
          updatedAt: new Date(),
        },
      });
    console.log(`seeded ${instrument.symbol}`);
  }

  console.log(`เสร็จ — seed แล้ว ${INSTRUMENT_SEED.length} instruments`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
