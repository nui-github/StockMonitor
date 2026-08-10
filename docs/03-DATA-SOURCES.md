# 03 — Data Sources & Provider Adapter

> ⚠️ ราคา/โควตา/เงื่อนไข tier ของแต่ละเจ้า **เปลี่ยนบ่อย** — ยืนยันจากหน้า pricing จริงก่อนผูกสัญญา
> ตารางนี้ใช้เพื่อ "เลือกสถาปัตยกรรม" ไม่ใช่เพื่อ "ยืนยันราคา"

## 1. ราคา/กราฟ (market data)

| Provider | ครอบคลุม | Realtime | จุดเด่น | จุดระวัง |
|----------|---------|----------|--------|---------|
| **Finnhub** | US stock, ETF, FX, crypto | WebSocket trade stream | free tier ใจกว้าง, มี news + company profile ในเจ้าเดียว | commodity จำกัด, rate limit ต่ำใน free |
| **Twelve Data** | stock, ETF, FX, **commodity**, index | WS (แพ็กเสียเงิน) | ครอบคลุม asset class กว้าง, API สะอาด | free tier credit น้อย |
| **Polygon.io** | US เต็มระบบ | WS ระดับ tick | คุณภาพสูงสุด, historical ลึก | แพงสุดในกลุ่ม |
| **Alpha Vantage** | กว้าง | ไม่มี (delayed) | ฟรี, ใช้ทำ backfill ได้ | 25–500 req/วัน, ช้า |
| **yahoo-finance2** (unofficial) | เกือบทุกอย่าง รวม `GC=F`, `CL=F` | ~15 นาที delay | ฟรี, ครอบคลุมดีมาก | ไม่มี SLA, ToS เสี่ยง — **ใช้ได้แค่ dev/fallback ห้ามพึ่งใน production** |

**แผนที่แนะนำ**
- P1: `Finnhub` (stock/ETF realtime) + `Twelve Data` (commodity + backup) + `Alpha Vantage` (backfill รายวัน)
- P2: ย้ายไป `Polygon` ถ้าต้องการ tick-level / depth

## 2. หุ้นไทย (SET) — P3

ข้อมูล SET realtime **ไม่มีของฟรีถูกกฎหมาย** ต้องผ่านหนึ่งใน:
- SET Market Data / SETTRADE vendor licence (มีค่า licence + ต้องทำสัญญา redistribution)
- vendor ต่อยอด (Refinitiv/LSEG, Bloomberg, Quandl-type reseller)
- delayed data 15 นาที ผ่านผู้ให้บริการที่มีสิทธิ์

**อย่าดึงจากหน้าเว็บ settrade/set.or.th ตรง ๆ** — ผิด ToS และพังง่าย
โครงสร้าง provider ออกแบบให้เสียบ `SetProvider` เพิ่มทีหลังได้โดยไม่แตะ UI

## 3. Commodity mapping

| สินค้า | สัญลักษณ์ในระบบ | ที่มา |
|-------|----------------|------|
| ทองคำ | `XAUUSD` | Twelve Data (spot) |
| เงิน | `XAGUSD` | Twelve Data |
| น้ำมัน WTI | `WTI` | Twelve Data / EIA |
| น้ำมัน Brent | `BRENT` | Twelve Data |
| ก๊าซธรรมชาติ | `NATGAS` | Twelve Data |
| ทองแดง | `COPPER` | Twelve Data |
| ทองในไทย (option) | `THBGOLD` | สมาคมค้าทองคำ (สคริปต์แยก, ไม่ realtime) |

เก็บ mapping ที่ `src/lib/config/markets.ts` — 1 symbol ภายใน → หลาย symbol ของ vendor

## 4. ข่าว / บทวิเคราะห์ (input ของ AI)

### จัดชั้นความน่าเชื่อถือ (`sourceTier`)

| Tier | น้ำหนัก | ตัวอย่าง |
|------|--------|---------|
| 1 | 1.0 | Reuters, Bloomberg, AP, WSJ, Financial Times, CNBC, Nikkei Asia |
| 2 | 0.7 | MarketWatch, Barron's, Investing.com, Yahoo Finance, Business Insider |
| 3 | 0.5 | SEC EDGAR filing, press release ของบริษัทเอง, earnings transcript |
| 4 | 0.3 | บล็อก/Seeking Alpha/สื่อไทยทั่วไป (กรุงเทพธุรกิจ, ประชาชาติ, ThaiPublica) |
| — | 0 | ฟอรัม/โซเชียล — ใช้ได้แค่วัด sentiment ไม่ใช้เป็นข้อเท็จจริง |

เก็บรายการจริงที่ `src/lib/config/sources.ts` พร้อม `domain`, `tier`, `rss`, `lang`

### วิธีดึง
1. **News API ของ data provider** (Finnhub `/company-news`, Twelve Data news) — ง่ายสุด, มี symbol mapping มาให้
2. **RSS โดยตรง** ของสำนักข่าว — ฟรี, สดกว่า, ต้อง map symbol เอง (NER + ticker dictionary)
3. **SEC EDGAR full-text search API** — ฟรี, filing 8-K/10-Q เป็น signal ชั้นดี
4. **Macro**: FRED API (ดอกเบี้ย, CPI), EIA (สต็อกน้ำมัน) — ฟรี, ใช้เป็นบริบท commodity

### ⚠️ ลิขสิทธิ์ (สำคัญ)
- เก็บได้: หัวข้อ, URL, ชื่อแหล่ง, เวลา, สรุปที่ **เราเขียนใหม่**, embedding
- ห้าม: แสดงเนื้อข่าวเต็มบนเว็บเรา, quote ยาว, ทำ mirror
- แสดงผลเสมอ: ชื่อแหล่ง + ลิงก์ออกไปต้นทาง
- เคารพ `robots.txt` + rate limit ตอน fetch full text (เก็บไว้ในระบบเพื่อสังเคราะห์เท่านั้น)
- รายละเอียด: [docs/10](10-COMPLIANCE.md)

## 5. Provider adapter interface

```ts
// src/lib/providers/types.ts
export interface QuoteProvider {
  readonly id: string;
  supports(a: AssetClass): boolean;
  getQuote(symbol: string): Promise<Result<Quote, ProviderError>>;
  getQuotes(symbols: string[]): Promise<Result<Quote[], ProviderError>>;
  subscribe?(symbols: string[], onTick: (q: Tick) => void): Unsubscribe;
}

export interface CandleProvider {
  getCandles(symbol: string, tf: Timeframe, range: Range): Promise<Result<Candle[], ProviderError>>;
}

export interface NewsProvider {
  getNews(symbol: string, since: Date): Promise<Result<RawArticle[], ProviderError>>;
}
```

`registry.ts` เลือก provider ตาม `assetClass` + สถานะสุขภาพ (circuit breaker: error 5 ครั้งใน 1 นาที → ปิด 60 วิ → ลอง half-open)

## 6. Normalization rules

- เวลา: เก็บ **UTC (epoch ms)** ทุกจุด แปลงเป็น `Asia/Bangkok` เฉพาะตอนแสดงผล
- ราคา: `number` (float64) พอสำหรับแสดงผล; ถ้าทำ portfolio P/L ใช้ `decimal` (string) กันปัดเศษ
- สกุลเงิน: เก็บ `currency` ทุกรายการ ห้าม assume USD
- symbol ภายใน: `AAPL`, `SPY`, `XAUUSD`, `SET:PTT` (มี prefix ตลาดเมื่อไม่ใช่ US)
- สถานะตลาด: คำนวณเองจาก `markets.ts` (เวลาเปิด-ปิด + วันหยุด) ไม่พึ่ง provider

## 7. Env ที่ต้องมี

ดู `.env.example` — key ทั้งหมดเป็น **server-side** ห้ามขึ้นต้น `NEXT_PUBLIC_`
