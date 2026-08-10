# CLAUDE.md — StockMonitor

เว็บติดตามราคาหุ้น/ETF/Commodity realtime + บทวิเคราะห์ AI ภาษาไทย
Next.js 15 App Router · TypeScript strict · Tailwind v4 · lucide-react · Postgres+Drizzle · Redis · Claude API

อ่านก่อนเริ่มงาน: [docs/01](docs/01-ARCHITECTURE.md), [docs/02](docs/02-PROJECT-STRUCTURE.md)

## กฎที่ห้ามละเมิด

1. **Layer**: `app/` → `lib/services/` → `lib/providers/` → vendor
   - component ห้าม import `lib/providers/*` หรือ `lib/db/*` ตรง ๆ
   - `lib/providers/*` ห้าม import React
2. **Secret**: API key อยู่ฝั่ง server เท่านั้น — ห้าม `NEXT_PUBLIC_` กับความลับ
3. **เวลา**: เก็บ UTC (epoch ms / timestamptz) เสมอ แปลง `Asia/Bangkok` ตอนแสดงผลเท่านั้น
4. **External data**: ทุก response จาก provider ต้อง `zod.safeParse` ก่อนใช้
5. **`any` ต้องห้าม** — ใช้ `unknown` + parse
6. **ตัวเลขราคา** render ด้วย `font-mono tabular-nums`
7. **ทุก component ที่โหลดข้อมูล** ต้องมี loading / empty / error / stale state
8. **บทวิเคราะห์ AI** ต้องมี citation + disclaimer + ป้าย "สร้างโดย AI" เสมอ; ห้าม output คำแนะนำซื้อขาย ([docs/10](docs/10-COMPLIANCE.md))
9. **AI สร้างเมื่อผู้ใช้กดเท่านั้น** — ห้ามมี cron/auto-generate/prefetch ที่เรียก Anthropic API
   - `GET /api/v1/analysis/*` อ่าน cache อย่างเดียว ห้ามสร้าง
   - สร้างผ่าน `POST .../generate` ที่ต้อง login + มี `confirmedCostThb` + ผ่าน rate limit
   - ก่อนสร้างต้องแสดงต้นทุนโดยประมาณ (จาก `count_tokens` ซึ่งฟรี) ให้ผู้ใช้ยืนยัน ([docs/05 §7](docs/05-AI-PIPELINE.md), [docs/04 §5](docs/04-API-SPEC.md))
   - หลังสร้างเสร็จบันทึกต้นทุนจริงลง `ai_reports` + `usage_daily`

## Claude API — ข้อควรระวัง (ปัจจุบัน)

- model: `claude-opus-5` (หลัก), `claude-haiku-4-5` (งานเบา)
- ใช้ `thinking: { type: 'adaptive' }` + `output_config: { effort }`
- **ห้ามส่ง** `temperature` / `top_p` / `top_k` → 400
- **ห้ามใช้ assistant prefill** → 400; ใช้ structured output (`output_config.format`) แทน
- `max_tokens` > ~16000 ต้อง stream (`.stream()` + `.finalMessage()`)
- ใส่ `cache_control: { type: 'ephemeral' }` บน system prompt ที่ยาวและคงที่

## คำสั่ง

```bash
npm run dev          # dev (Turbopack)
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint
npm run test         # vitest
npm run test:e2e     # playwright
npm run db:push      # drizzle push (dev)
npm run db:generate  # สร้าง migration
npm run db:studio
```

## Convention

- component `PascalCase.tsx`, util/service `kebab-case.ts`, hook `useThing.ts`
- cache key `{domain}:{id}:{variant}` เช่น `candle:AAPL:1D`
- API route `/api/v1/<resource>` (พหูพจน์)
- commit: Conventional Commits
- `"use client"` ให้อยู่ปลายกิ่งที่สุด

## ต้องมีเทสก่อน merge

`lib/indicators/*` (golden dataset) และ provider mapper — ผิดเมื่อไหร่ตัวเลขผิดทั้งเว็บ
