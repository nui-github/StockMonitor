# 00 — PRD (Product Requirements)

## 1. เป้าหมาย

ให้นักลงทุนรายย่อยไทยดูราคา **หุ้นรายตัว / ETF / Commodity** ได้ในหน้าเดียว
พร้อมบทวิเคราะห์ AI ภาษาไทยที่ **อ้างอิงแหล่งข่าวจริง** + วิเคราะห์กราฟเทคนิค
ลดเวลาอ่านข่าวหลายสิบแหล่งเหลือ 1 หน้าสรุป

## 2. Non-goals (ไม่ทำ)

- ไม่ส่งคำสั่งซื้อขาย / ไม่เชื่อมโบรกเกอร์
- ไม่ให้คำแนะนำลงทุนรายบุคคล (ไม่มี "ควรซื้อ/ควรขาย" ผูกกับพอร์ตผู้ใช้)
- ไม่รับฝากเงิน / ไม่มี social trading
- MVP ไม่ทำ mobile app (responsive web พอ)

## 3. กลุ่มผู้ใช้

| Persona | ต้องการ | ความถี่ |
|---------|--------|---------|
| นักลงทุนรายย่อย | ราคา + สรุปข่าวไทย เข้าใจง่าย | รายวัน |
| เทรดเดอร์ระยะสั้น | ราคา realtime + สัญญาณเทคนิค + alert | ทั้งวัน |
| ผู้ศึกษาตลาด | บทวิเคราะห์เชิงลึก + อ้างอิงแหล่ง | รายสัปดาห์ |

## 4. Asset class ที่รองรับ

| ประเภท | ตัวอย่าง | เฟส |
|--------|---------|-----|
| หุ้นสหรัฐ | AAPL, NVDA, TSLA | P1 |
| ETF | SPY, QQQ, VOO, GLD, ARKK | P1 |
| Commodity | XAU/USD (ทอง), WTI/Brent (น้ำมัน), เงิน, ทองแดง, ก๊าซ | P1 |
| Crypto (option) | BTC, ETH | P2 |
| หุ้นไทย (SET) | PTT, KBANK, DELTA | P3 — ต้องซื้อ data feed (ดู docs/03) |
| FX / Index | USDTHB, DXY, SET Index | P3 |

## 5. Feature list

### P0 — MVP (ต้องมี)
- **F1 Search & Instrument page** — ค้นด้วย ticker/ชื่อ, หน้ารายละเอียดต่อสินทรัพย์
- **F2 Realtime quote** — ราคา, %เปลี่ยน, high/low, volume, สถานะตลาด (เปิด/ปิด/pre/after)
- **F3 Chart** — candlestick + volume, timeframe 1D/5D/1M/6M/YTD/1Y/5Y, indicator: MA, EMA, RSI, MACD, Bollinger, Volume
- **F4 AI Analysis** — บทสรุปไทย: sentiment, key drivers, bull/bear case, มุมมองเทคนิค, ความเสี่ยง, ระดับความมั่นใจ + **citation ทุกข้ออ้าง**
- **F5 News feed** — ข่าวรวมต่อสินทรัพย์ จัดกลุ่ม + ให้คะแนนความน่าเชื่อถือแหล่ง
- **F6 Watchlist** — เพิ่ม/ลบ/เรียง, เก็บ localStorage (guest) หรือ DB (login)
- **F7 Market overview** — dashboard: index, gainers/losers, commodity board, heatmap

### P1
- **F8 Alerts** — แจ้งเตือนราคาผ่าน/หลุดระดับ, %เปลี่ยนแรง, ข่าวใหญ่ (Web Push + email)
- **F9 Compare** — เทียบสินทรัพย์หลายตัวบนกราฟเดียว (normalized %)
- **F10 Portfolio tracker** — จำนวนหุ้น/ต้นทุน, P/L, ไม่ผูกโบรกเกอร์
- **F11 Screener** — กรองด้วย fundamentals + technical

### P2
- **F12 AI chat ต่อสินทรัพย์** — ถามต่อจากบทวิเคราะห์ (RAG จาก corpus เดียวกัน)
- **F13 Digest รายวัน** — สรุปเช้าอีเมลตาม watchlist
- **F14 i18n สลับ TH/EN** (โครงสร้างเตรียมไว้ตั้งแต่ P0)

## 6. หน้าเว็บหลัก (IA)

```
/                      Dashboard — ภาพรวมตลาด + watchlist
/markets               Board: stocks | etf | commodities (tab)
/s/[symbol]            หน้าสินทรัพย์ (quote + chart + AI + news)
/s/[symbol]/news       ข่าวทั้งหมด
/s/[symbol]/analysis   บทวิเคราะห์ AI ฉบับเต็ม + ประวัติย้อนหลัง
/compare?s=AAPL,NVDA   เปรียบเทียบ
/watchlist             รายการติดตาม
/alerts                ตั้งเตือน (P1)
/about, /disclaimer, /privacy, /terms
```

## 7. Success metrics

| Metric | เป้า MVP |
|--------|---------|
| Quote latency (tick → หน้าจอ) | < 2s (US market hours) |
| LCP หน้า `/s/[symbol]` | < 2.0s (p75, mobile) |
| AI report generation | < 25s (background), หน้าเว็บอ่าน cache < 300ms |
| Citation coverage | ทุกย่อหน้าหลักมีอย่างน้อย 1 แหล่ง |
| Data cost / MAU | < 5 THB |

## 8. Acceptance criteria (ตัวอย่าง F4)

- บทวิเคราะห์ต้องมี field ครบตาม schema ใน [docs/05](05-AI-PIPELINE.md#report-schema)
- ทุก claim ที่อ้างข่าว ต้องมี `sourceId` ชี้ไป article จริงในฐานข้อมูล
- ถ้าข่าวใหม่ < 3 ชิ้นใน 7 วัน → แสดง "ข้อมูลจำกัด" + ลด confidence
- ต้องขึ้น disclaimer ทุกหน้าที่แสดงบทวิเคราะห์
- ไม่มีข้อความสั่งซื้อขายตรง ๆ ("ซื้อเลย", "เป้า X บาท ภายในเดือนนี้")
