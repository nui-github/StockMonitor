# 04 — API Spec (internal, `/api/v1`)

## 0. กติกาทั่วไป

- ทุก response ห่อรูปแบบเดียว
```jsonc
{ "data": <T>, "meta": { "asOf": 1754800000000, "source": "finnhub", "cached": true, "delayed": false } }
// error
{ "error": { "code": "PROVIDER_UNAVAILABLE", "message": "…", "retryable": true } }
```
- HTTP code: 200 / 400 (validation) / 401 / 404 / 429 (พร้อม `Retry-After`) / 502 (provider) / 503
- ทุก input ผ่าน Zod; ทุก endpoint ระบุ `runtime` และ `revalidate` ชัดเจน
- `Cache-Control` ตั้งให้ตรงกับ TTL ใน [docs/01 §4](01-ARCHITECTURE.md)

---

## 1. `GET /api/v1/search`
ค้นสินทรัพย์

| param | ชนิด | ค่าเริ่มต้น |
|-------|-----|-----------|
| `q` | string(1..32) | — (required) |
| `type` | `stock\|etf\|commodity\|all` | `all` |
| `limit` | 1..20 | 10 |

```jsonc
{ "data": [{ "symbol":"AAPL", "name":"Apple Inc.", "nameTh":"แอปเปิล",
             "assetClass":"stock", "exchange":"NASDAQ", "currency":"USD", "logo":"…" }] }
```

## 2. `GET /api/v1/quotes?symbols=AAPL,SPY,XAUUSD`
สูงสุด 50 symbol/ครั้ง

```jsonc
{ "data": [{
  "symbol":"AAPL", "price":231.45, "change":2.31, "changePct":1.01,
  "open":229.1, "high":232.8, "low":228.4, "prevClose":229.14,
  "volume":48213000, "currency":"USD",
  "marketState":"open",          // pre | open | post | closed | holiday
  "ts":1754800000000, "delayedMinutes":0
}]}
```

## 3. `GET /api/v1/candles/[symbol]`

| param | ค่า |
|-------|-----|
| `tf` | `1m\|5m\|15m\|1h\|1d\|1wk\|1mo` |
| `range` | `1d\|5d\|1mo\|6mo\|ytd\|1y\|5y\|max` |
| `indicators` | csv เช่น `sma20,ema50,rsi14,macd,bb20` (option) |

```jsonc
{ "data": {
  "symbol":"AAPL","tf":"1d","currency":"USD",
  "candles":[{ "t":1754800000000,"o":229.1,"h":232.8,"l":228.4,"c":231.45,"v":48213000 }],
  "indicators": { "sma20":[…], "rsi14":[…], "macd":{ "macd":[…],"signal":[…],"hist":[…] } }
}}
```
> indicator คำนวณฝั่ง server (`lib/indicators`) — ผลลัพธ์ align index กับ `candles` เติม `null` ช่วงต้น

## 4. `GET /api/v1/news/[symbol]`

| param | ค่า |
|-------|-----|
| `limit` | 1..50 (20) |
| `minTier` | 1..4 (4) |
| `since` | ISO date |

```jsonc
{ "data": [{
  "id":"a_9f2…", "title":"…", "titleTh":"…", "url":"https://…",
  "source":{ "name":"Reuters","domain":"reuters.com","tier":1 },
  "publishedAt":1754790000000, "summaryTh":"สรุปที่เราเขียนเอง 2-3 บรรทัด",
  "sentiment":0.42, "imageUrl":null
}]}
```
> `summaryTh` = ข้อความที่ระบบสร้างใหม่ ไม่ใช่ตัดลอกจากต้นฉบับ

## 5. Analysis — **on-demand เท่านั้น**

> 3 endpoint แยกหน้าที่ชัดเจน: **อ่าน** (ฟรี) → **ประเมินราคา** (ฟรี) → **สร้าง** (เสียเงิน)
> `GET` ต้องไม่มีวันสร้าง report — การสร้างเกิดจาก `POST` ที่ผู้ใช้ยืนยันแล้วเท่านั้น

### 5.1 `GET /api/v1/analysis/[symbol]` — อ่าน cache (ฟรี)

| param | ค่า |
|-------|-----|
| `horizon` | `short\|medium\|long` (`short` = 1–4 สัปดาห์) |

- มี report ที่ยังไม่หมดอายุ → `200` + Report schema ([docs/05 §4](05-AI-PIPELINE.md#4-report-schema))
- ไม่มี → `200` พร้อม `status: "none"` (**ไม่ใช่ 404** — หน้าเว็บต้องเรนเดอร์ EmptyState + ปุ่มสร้าง)

```jsonc
// ไม่มี report
{ "data": { "status": "none", "canGenerate": true, "newsAvailable": 24 } }

// มี report
{ "data": {
  "status": "ready",
  "report": { /* ReportSchema */ },
  "meta": {
    "generatedAt": 1754790000000, "expiresAt": 1754811600000,
    "model": "claude-haiku-4-5", "sourceCount": 24,
    "costThb": 1.58,
    "newsSince": 3,            // ข่าวใหม่ที่เข้ามาหลังสร้าง report นี้
    "isStale": false,
    "disclaimer": "…"
  }
}}
```

### 5.2 `GET /api/v1/analysis/[symbol]/estimate` — ประเมินต้นทุน (ฟรี)

เรียกตอนผู้ใช้กดปุ่ม ก่อนเปิด dialog ยืนยัน ใช้ `count_tokens` ซึ่งไม่คิดเงิน

| param | ค่า |
|-------|-----|
| `model` | `standard` (haiku) \| `deep` (opus) — default `standard` |

```jsonc
{ "data": {
  "model": "claude-haiku-4-5",
  "modelLabel": "มาตรฐาน",
  "inputTokens": 31240, "estOutputTokens": 3000,
  "estCostUsd": 0.0462, "estCostThb": 1.52,
  "isEstimate": true,
  "newsCount": 24,
  "quota": { "usedToday": 3, "dailyLimit": 10, "resetsAt": 1754838000000 },
  "canGenerate": true
}}
```

### 5.3 `POST /api/v1/analysis/[symbol]/generate` — สร้างจริง (**เสียเงิน**)

```jsonc
// request
{ "horizon": "short", "model": "standard", "confirmedCostThb": 1.52 }
```

| กติกา | รายละเอียด |
|-------|-----------|
| ต้อง login | guest กดไม่ได้ (กันคนอื่นเผาเครดิตเรา) |
| ต้องมี `confirmedCostThb` | ยืนยันว่า client แสดง dialog ให้ผู้ใช้เห็นแล้ว — ขาด field นี้ → `400 CONFIRMATION_REQUIRED` |
| Idempotency | header `Idempotency-Key` ต่อ (user, symbol, ชั่วโมง) — ยิงซ้ำคืนผลเดิม ไม่สร้างใหม่ |
| Rate limit | 3/ชม. และ 10/วัน ต่อ user → เกิน = `429 QUOTA_EXCEEDED` + `Retry-After` |
| Global cap | เกิน `AI_DAILY_REPORT_CAP` → `429 SERVICE_QUOTA_EXCEEDED` |
| Runtime | `nodejs`, `maxDuration = 60` (Vercel) — ใช้ streaming ภายในกัน timeout |
| ยกเลิก | client ตัดการเชื่อมต่อ → server abort request ไป Anthropic; **token ที่ใช้ไปแล้วยังถูกคิดเงิน** |

```jsonc
// 201 สำเร็จ
{ "data": {
  "report": { /* ReportSchema */ },
  "meta": {
    "generatedAt": 1754800000000, "model": "claude-haiku-4-5",
    "inputTokens": 31240, "outputTokens": 2870, "cacheReadTokens": 18400,
    "actualCostUsd": 0.0455, "actualCostThb": 1.50,   // ต้นทุนจริง
    "sourceCount": 24, "verifyWarnings": []
  }
}}
```

```jsonc
// 429 เกินโควตา
{ "error": {
  "code": "QUOTA_EXCEEDED",
  "message": "ครบโควตาสร้างบทวิเคราะห์ของวันนี้แล้ว (10/10) รีเซ็ตเวลา 07:00 น.",
  "retryable": true
}}
```

### 5.4 `GET /api/v1/analysis/[symbol]/history?limit=10`

รายการ report ย้อนหลัง (metadata + sentiment + ราคาตอนสร้าง) — ดูว่า AI เคยมองยังไงแล้วราคาไปทางไหน

### 5.5 `GET /api/v1/usage` (ต้อง login)

```jsonc
{ "data": {
  "today":     { "reports": 3,  "costThb": 4.6 },
  "thisMonth": { "reports": 41, "costThb": 62.3 },
  "quota":     { "dailyLimit": 10, "resetsAt": 1754838000000 }
}}
```

## 6. `GET /api/v1/stream/quotes?symbols=…` (SSE)

```
event: quote
data: {"symbol":"AAPL","price":231.5,"change":2.36,"changePct":1.03,"ts":1754800001234}

event: heartbeat
data: {"ts":1754800015000}

event: status
data: {"marketState":"closed","reason":"after-hours"}
```
- `text/event-stream`, `Cache-Control: no-store`, `X-Accel-Buffering: no`
- client reconnect อัตโนมัติแบบ exponential backoff (1s → 30s) + `Last-Event-ID`
- ตลาดปิด → server ส่ง `status` แล้วปิดสตรีม, client สลับไป polling 60 วิ

## 7. Watchlist (ต้อง auth)

| Method | Path | Body / ผลลัพธ์ |
|--------|------|----------------|
| `GET` | `/api/v1/watchlist` | รายการ + quote ล่าสุด |
| `POST` | `/api/v1/watchlist` | `{ "symbol":"AAPL" }` |
| `DELETE` | `/api/v1/watchlist/[symbol]` | 204 |
| `PATCH` | `/api/v1/watchlist/reorder` | `{ "order": ["SPY","AAPL"] }` |

Guest: เก็บ localStorage, merge เข้า DB เมื่อ login ครั้งแรก

## 8. Alerts (P1, ต้อง auth)

`GET /api/v1/alerts` — รายการของฉัน
`POST /api/v1/alerts`
```jsonc
{ "symbol":"AAPL", "type":"price_above", "value":250 }
```
`DELETE /api/v1/alerts/[id]`

`type` เต็ม spec: `price_above | price_below | pct_change | volume_spike | news_breaking`
> ตอนนี้ทำแค่ `price_above | price_below | pct_change` (เช็คจาก quote ตรง ๆ) — `volume_spike` ต้องมี baseline
> volume เฉลี่ยย้อนหลังที่ยังไม่มีข้อมูล, `news_breaking` ต้อง hook เข้า `ingest-news` เพิ่ม ทำทีหลังตอนมีของสองอย่างนี้

channel รอบนี้มีแค่ `push` (Web Push, VAPID) — `email` ยังไม่ทำ (ต้องเลือก email provider ก่อน ดู docs/09 Phase 5)

`POST /api/v1/push/subscribe` — บันทึก push subscription ของอุปกรณ์นี้ (`{ endpoint, keys: { p256dh, auth } }` ตรง PushSubscription.toJSON())
`DELETE /api/v1/push/subscribe` — `{ "endpoint": "..." }`

## 9. Cron (ภายใน)

`GET|POST /api/cron/[job]` — ต้องมี header `Authorization: Bearer $CRON_SECRET`
`job` ∈ `ingest-news | embed-articles | refresh-candles | evaluate-alerts | cleanup`

> handler รับทั้ง `GET` และ `POST`: Vercel Cron (ดู `vercel.json`) ยิง `GET` เสมอ ส่วน `POST` ไว้เผื่อ trigger มือ/GitHub Actions ([docs/11 §7](11-DEPLOY-GUIDE.md))

> ⚠️ **ไม่มี** `generate-analysis` ใน cron โดยเจตนา — บทวิเคราะห์สร้างจาก §5.3 เท่านั้น (ผู้ใช้กดเอง)

## 10. `GET /api/health`
```jsonc
{ "data": { "status":"ok", "db":"ok", "redis":"ok",
            "providers":{ "finnhub":"ok","twelvedata":"degraded" }, "version":"1.2.0" } }
```
