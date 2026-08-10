# 05 — AI Analysis Pipeline

## 1. ภาพรวม flow

```
[1] ingest      ดึงข่าว RSS/API + ราคา + filing
      ↓
[2] normalize   สกัดเนื้อ, ตัด boilerplate, ตรวจภาษา, dedupe (simhash)
      ↓
[3] enrich      map symbol (ticker dict + NER), ให้คะแนน source tier, sentiment เบื้องต้น
      ↓
[4] embed       chunk 800 tokens overlap 100 → embedding → pgvector
      ↓
[5] retrieve    ต่อ symbol: top-K ตาม (cosine × recency × sourceTier)
      ↓
[6] technical   คำนวณ indicator + S/R + pattern จาก OHLCV (โค้ด ไม่ใช่ LLM)
      ↓
[7] analyze     Claude → structured JSON (Zod schema) พร้อม citation
      ↓
[8] verify      ตรวจ citation ชี้ article จริง, ตัวเลขตรงกับ data, ไม่มีคำแนะนำซื้อขาย
      ↓
[9] store       เก็บ ai_reports + render บนเว็บ
```

## 2. Model & config

| งาน | Model | เหตุผล |
|-----|-------|--------|
| บทวิเคราะห์หลัก | `claude-opus-5` | คุณภาพการให้เหตุผลสูงสุด ($5/$25 per MTok) |
| แปล/สรุปหัวข้อข่าวรายชิ้น | `claude-haiku-4-5` | ถูก+เร็ว ($1/$5), งานง่าย |
| จัดหมวด/สกัด entity | `claude-haiku-4-5` | ปริมาณมาก |

**พารามิเตอร์สำคัญ (Claude API ปัจจุบัน)**
- ใช้ `thinking: { type: "adaptive" }` + `output_config: { effort: "high" }`
- ❌ **ห้ามส่ง** `temperature`, `top_p`, `top_k` → 400 บน Opus 5
- ❌ ห้ามใช้ assistant prefill → 400 ; ใช้ structured output แทน
- `max_tokens` > ~16000 ต้อง **stream** (ใช้ `.stream()` + `.finalMessage()`)
- prompt caching: ใส่ `cache_control: { type: "ephemeral" }` บน system prompt (ยาวคงที่) ลดค่าใช้จ่าย ~90% ของส่วน cache

```ts
// src/lib/ai/client.ts
import Anthropic from '@anthropic-ai/sdk';
export const anthropic = new Anthropic(); // อ่าน ANTHROPIC_API_KEY จาก env
```

```ts
// src/lib/ai/pipeline.ts (ย่อ)
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { ReportSchema } from './schema';

const res = await anthropic.messages.parse({
  model: 'claude-opus-5',
  max_tokens: 8000,
  thinking: { type: 'adaptive' },
  output_config: { format: zodOutputFormat(ReportSchema) },
  system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
  messages: [{ role: 'user', content: buildUserPrompt({ instrument, quote, technical, articles }) }],
});
const report = res.parsed_output!;
```

> ถ้าอยากให้ AI ค้นข่าวเพิ่มเองแบบสด ใช้ server tool `web_search_20260209`
> (`tools: [{ type: 'web_search_20260209', name: 'web_search' }]`) — มี dynamic filtering ในตัว
> แต่ **ค่าใช้จ่ายและ latency สูงกว่า** pipeline RAG ของเราเอง → ใช้เป็น fallback เมื่อคลังข่าวว่าง

## 3. System prompt (โครง)

```
คุณคือนักวิเคราะห์ตลาดทุนที่เขียนภาษาไทยกระชับ ตรงประเด็น อ้างอิงหลักฐานเสมอ

ข้อบังคับ:
1. ทุกข้อความเชิงข้อเท็จจริงต้องอ้าง sourceId จากรายการข่าวที่ให้มาเท่านั้น
   ห้ามใช้ความรู้นอกบริบทเป็นข้อเท็จจริงเรื่องราคา/ตัวเลข/เหตุการณ์ล่าสุด
2. ห้ามคัดลอกประโยคจากข่าวเกิน 15 คำ ให้เรียบเรียงใหม่
3. ห้ามให้คำแนะนำซื้อ/ขาย/ถือ ห้ามระบุราคาเป้าหมายเป็นคำแนะนำ
   ให้เสนอเป็น "มุมมองฝั่งบวก / ฝั่งลบ" พร้อมเงื่อนไขที่ต้องติดตาม
4. ถ้าหลักฐานไม่พอ ให้ระบุตรง ๆ และลด confidence
5. แยก "ข้อเท็จจริง" กับ "การตีความ" ให้ชัดในเนื้อความ
6. วิเคราะห์เทคนิคใช้ตัวเลข indicator ที่ให้มาเท่านั้น ห้ามเดาค่า
```

**User prompt ประกอบด้วย**: ข้อมูลสินทรัพย์, quote ปัจจุบัน, ตาราง indicator + S/R, สรุปข่าว 15–30 ชิ้น (id, แหล่ง, tier, เวลา, สรุปสั้น)

## 4. Report schema

```ts
// src/lib/ai/schema.ts
import { z } from 'zod';

export const ReportSchema = z.object({
  headline: z.string(),                    // พาดหัวสรุป 1 บรรทัด
  summaryTh: z.string(),                   // 3-5 ประโยค
  sentiment: z.number().min(-1).max(1),    // -1 ลบมาก .. +1 บวกมาก
  sentimentLabel: z.enum(['very_bearish','bearish','neutral','bullish','very_bullish']),
  keyDrivers: z.array(z.object({
    title: z.string(), detail: z.string(),
    impact: z.enum(['high','medium','low']),
    direction: z.enum(['positive','negative','mixed']),
    sourceIds: z.array(z.string()).min(1),
  })).max(6),
  bullCase: z.array(z.object({ point: z.string(), sourceIds: z.array(z.string()) })).max(5),
  bearCase: z.array(z.object({ point: z.string(), sourceIds: z.array(z.string()) })).max(5),
  technical: z.object({
    trend: z.enum(['uptrend','downtrend','sideways']),
    momentum: z.enum(['strong','moderate','weak']),
    supports: z.array(z.number()).max(3),
    resistances: z.array(z.number()).max(3),
    signals: z.array(z.object({
      indicator: z.string(),               // 'RSI14' | 'MACD' | 'MA50/200' ...
      reading: z.string(),                 // '68.2 (ใกล้ overbought)'
      interpretation: z.string(),
    })).max(8),
    note: z.string(),
  }),
  risks: z.array(z.string()).max(5),
  watchNext: z.array(z.string()).max(5),   // เหตุการณ์/ตัวเลขที่ต้องติดตาม
  confidence: z.number().min(0).max(1),
  dataGaps: z.array(z.string()),           // สิ่งที่ข้อมูลไม่พอ
});
```

Response ที่ API ส่งออก = schema นี้ + `meta` (`generatedAt`, `model`, `horizon`, `sourceCount`, `sources[]`, `disclaimer`)

## 5. การวิเคราะห์กราฟ (technical)

**คำนวณด้วยโค้ด แล้วป้อนตัวเลขให้ LLM ตีความ** — ไม่ส่งภาพกราฟ ไม่ให้ LLM คำนวณเอง

| กลุ่ม | รายการ |
|------|-------|
| Trend | SMA 20/50/200, EMA 12/26, ADX |
| Momentum | RSI 14, MACD (12,26,9), Stochastic |
| Volatility | Bollinger (20,2), ATR 14 |
| Volume | Volume MA20, OBV |
| Structure | swing high/low → S/R (clustering), 52w high/low, gap |

เหตุผล: ตัวเลขตรวจสอบซ้ำได้, ไม่หลอน, ถูกกว่า, เทสได้ (golden dataset ใน `tests/indicators`)

## 6. Verification layer (บังคับก่อนเผยแพร่)

| เช็ค | ถ้าไม่ผ่าน |
|------|-----------|
| `sourceIds` ทุกตัวมีอยู่จริงใน corpus ที่ป้อนเข้าไป | ตัด claim นั้นทิ้ง |
| ตัวเลข S/R อยู่ในช่วง ±30% ของราคาปัจจุบัน | ตัด/ตั้ง flag |
| ไม่มี regex คำสั่งซื้อขาย (`ซื้อเลย|ควรขาย|เป้า.*บาท`) | regenerate 1 ครั้ง แล้ว fallback |
| จำนวนแหล่งอ้างอิง ≥ 3 | ลด confidence + ขึ้น badge "ข้อมูลจำกัด" |
| ความยาว quote จากข่าว ≤ 15 คำ | ตัด |

## 7. Trigger — **on-demand เท่านั้น** (ไม่มี cron)

> **กฎเหล็ก**: ระบบ **ห้าม**สร้างบทวิเคราะห์เองโดยอัตโนมัติ
> ทุกฉบับต้องเกิดจากผู้ใช้กดปุ่ม และผู้ใช้ต้องเห็นค่าใช้จ่ายโดยประมาณก่อนกดยืนยัน

```
เปิดหน้า /s/[symbol]
      ↓
มี report ใน DB ที่ยังไม่หมดอายุ? ──ใช่──▶ แสดง report (ฟรี ไม่เรียก API)
      │ ไม่มี
      ▼
แสดง EmptyState: "ยังไม่มีบทวิเคราะห์" + ปุ่ม [สร้างบทวิเคราะห์]
      ↓ (ผู้ใช้กด)
GET /api/v1/analysis/{symbol}/estimate  → ต้นทุนโดยประมาณ + จำนวนข่าวที่จะใช้
      ↓
CostWarningDialog: "ใช้เครดิตประมาณ X.XX บาท • วันนี้ใช้ไป N/M ฉบับ"  [ยกเลิก] [ยืนยัน]
      ↓ (ยืนยัน)
POST /api/v1/analysis/{symbol}/generate → สร้างจริง → เก็บ DB → แสดงผล
```

**ไม่มี** cron `generate-analysis`, **ไม่มี** event trigger อัตโนมัติ (ข่าวใหม่/ราคาขยับแรง แค่ขึ้น badge "มีข่าวใหม่ 3 ชิ้นหลังบทวิเคราะห์นี้" ให้ผู้ใช้ตัดสินใจกดเอง)

### Cost control layers

| ชั้น | กลไก |
|-----|------|
| 1. Cache | report ใน DB อายุ 6 ชม. — กดซ้ำในช่วงนี้อ่าน cache ฟรี ไม่เรียก API |
| 2. Confirm | ต้องกดยืนยันใน dialog ที่แสดงต้นทุนทุกครั้ง |
| 3. Rate limit | 3 ฉบับ/ชม. และ 10 ฉบับ/วัน ต่อ user (`AI_USER_DAILY_CAP`) |
| 4. Global cap | `AI_DAILY_REPORT_CAP` ทั้งระบบ — เกินแล้ว endpoint คืน 429 พร้อมข้อความไทย |
| 5. Prompt cache | system prompt คงที่ → `cache_control: ephemeral` ลด input cost ~90% ของส่วนนั้น |
| 6. Model | เลือกได้ต่อครั้ง (ดู §7.1) |

### 7.1 ให้ผู้ใช้เลือกโมเดล

`CostWarningDialog` มี selector 2 ตัวเลือก:

| ตัวเลือก | Model | ต้นทุน/ฉบับ (โดยประมาณ) |
|---------|-------|------------------------|
| **มาตรฐาน** (default) | `claude-haiku-4-5` | ~1.5 บาท |
| **เชิงลึก** | `claude-opus-5` | ~8 บาท |

เก็บตัวเลือกล่าสุดไว้ใน localStorage เป็น default ครั้งถัดไป

### 7.2 การประมาณต้นทุน

คำนวณ**ก่อน**เรียก API ด้วย `client.messages.count_tokens()` (ฟรี ไม่คิดเงิน) กับ prompt จริงที่จะส่ง:

```ts
// src/lib/ai/estimate.ts
const USD_PER_MTOK = {
  'claude-opus-5':    { in: 5, out: 25 },
  'claude-sonnet-5':  { in: 2, out: 10 },   // ราคาโปรโมชันถึง 2026-08-31
  'claude-haiku-4-5': { in: 1, out: 5 },
} as const;

export async function estimateCost(model: keyof typeof USD_PER_MTOK, prompt: PromptParts) {
  const { input_tokens } = await anthropic.messages.countTokens({
    model, system: prompt.system, messages: prompt.messages,
  });
  const estOutput = 3000;                       // จาก p90 ของ report จริง — ปรับตามสถิติ
  const p = USD_PER_MTOK[model];
  const usd = (input_tokens / 1e6) * p.in + (estOutput / 1e6) * p.out;
  return {
    inputTokens: input_tokens,
    estOutputTokens: estOutput,
    usd,
    thb: usd * Number(process.env.USD_THB_RATE ?? 33),
    isEstimate: true,
  };
}
```

> ตัวเลขที่แสดงคือ **ประมาณการ** — output token จริงต่างจากที่ประเมินได้
> ต้องเขียนกำกับใน UI ว่า "โดยประมาณ" เสมอ และบันทึกต้นทุนจริงหลังสร้างเสร็จ

### 7.3 บันทึกต้นทุนจริง

หลังสร้างเสร็จ เก็บลง `ai_reports`: `inputTokens`, `outputTokens`, `cacheReadTokens`, `costUsd`
→ หน้า `/account/usage` แสดง "เดือนนี้คุณใช้ไป X ฉบับ ≈ Y บาท"

## 8. ภาษา

- corpus ข่าวส่วนใหญ่เป็นอังกฤษ → prompt สั่งให้ **คิดจากต้นฉบับ แต่เขียนผลลัพธ์เป็นไทย**
- ศัพท์การเงินคงคำอังกฤษในวงเล็บครั้งแรก เช่น "อัตรากำไรขั้นต้น (gross margin)"
- เตรียม field `summaryEn` ไว้สำหรับ i18n เฟส 2

## 9. UX contract ของปุ่มสร้างรายงาน (บังคับ)

| ข้อกำหนด | รายละเอียด |
|---------|-----------|
| ห้ามสร้างอัตโนมัติ | ไม่มี auto-generate ตอนโหลดหน้า ไม่มี prefetch ไม่มี cron |
| ต้องเตือนค่าใช้จ่าย | dialog แสดงตัวเลขโดยประมาณ + คำว่า "โดยประมาณ" + โควตาคงเหลือ |
| ต้องยืนยัน 2 จังหวะ | กดปุ่ม → dialog → กดยืนยัน (ปุ่มยืนยันไม่ใช่ autofocus) |
| แสดงสถานะระหว่างสร้าง | progress + ข้อความ "กำลังวิเคราะห์… ใช้เวลา 20–40 วินาที" + ปุ่มยกเลิก |
| ยกเลิกได้ | `AbortController` → ถ้ายกเลิกก่อนจบ ไม่บันทึก report (แต่ token ที่ใช้ไปแล้วยังถูกคิดเงิน — ต้องเขียนบอก) |
| แสดงต้นทุนจริงหลังเสร็จ | บรรทัดเล็กใต้ report: "ใช้ไป X.XX บาท • สร้างเมื่อ HH:mm" |
| กันกดซ้ำ | ปุ่ม disable ระหว่างสร้าง + idempotency key ต่อ (user, symbol, ชั่วโมง) |
| เมื่อเกินโควตา | ปุ่ม disable + ข้อความ "ครบโควตาวันนี้แล้ว (10/10) รีเซ็ตเวลา 07:00" |
| เมื่อมี report เก่าอยู่ | ปุ่มเปลี่ยนเป็น "สร้างใหม่" + เตือนว่าฉบับเดิมยังใช้ได้และฟรี |

**ข้อความใน `CostWarningDialog`** (ตัวอย่าง)

```
สร้างบทวิเคราะห์ AI สำหรับ AAPL

ระบบจะอ่านข่าว 24 ชิ้น + ข้อมูลเทคนิค แล้วสร้างบทสรุปภาษาไทย

  โมเดล      [ มาตรฐาน (เร็ว ประหยัด) ▾ ]
  ค่าใช้จ่าย  ประมาณ 1.60 บาท  (ตัวเลขจริงอาจต่างจากนี้)
  โควตา      วันนี้ใช้ไป 3/10 ฉบับ

บทวิเคราะห์ที่สร้างแล้วจะเก็บไว้ 6 ชั่วโมง เปิดดูซ้ำได้ไม่มีค่าใช้จ่าย

                                      [ ยกเลิก ]  [ ยืนยันและสร้าง ]
```

## 10. Observability ของ AI

log ทุกครั้ง: `symbol`, `model`, `inputTokens`, `outputTokens`, `cacheReadTokens`, `latencyMs`, `sourceCount`, `verifyFailures`, `stopReason`
→ dashboard ต้นทุน/วัน + อัตรา verification fail
