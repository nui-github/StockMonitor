# 11 — คู่มือ Deploy: GitHub → Vercel (ทำเองทีละขั้น)

เอกสารนี้เขียนให้ทำตามได้จริงตั้งแต่เครื่องเปล่าจนเว็บขึ้นออนไลน์
ภาพรวมสถาปัตยกรรม/checklist อยู่ที่ [docs/08](08-DEPLOYMENT.md) — ไฟล์นี้คือขั้นตอนลงมือ

```
เครื่องคุณ ──push──▶ GitHub ──webhook──▶ Vercel ──build+deploy──▶ เว็บออนไลน์
                                            │
                              Neon (Postgres) · Upstash (Redis) · Anthropic API
```

**หลักการเดียวที่ต้องจำ**: push ขึ้น `main` = deploy production อัตโนมัติ, push ขึ้น branch อื่น/เปิด PR = ได้ preview URL แยก ไม่กระทบของจริง

---

## ขั้นที่ 0 — เตรียมเครื่อง (ครั้งเดียว)

ต้องมี: Node 20+, git, บัญชี GitHub, บัญชี Vercel (สมัครด้วย GitHub ได้เลย)

```bash
node -v    # ต้อง >= 20
git --version
```

ติดตั้ง GitHub CLI ไว้จะสะดวกกว่ากดหน้าเว็บ:

```bash
brew install gh && gh auth login
```

---

## ขั้นที่ 1 — ทำโปรเจกต์ให้เป็น git repo

```bash
cd ~/Desktop/StockMonitor
git init -b main
```

**ก่อน commit แรก เช็คว่าไม่มีความลับหลุด:**

```bash
git status --short
```

ต้อง **ไม่เห็น** `.env`, `.env.local` ในรายการ (มี `.gitignore` กันไว้แล้ว)
ถ้าเห็น — หยุด แล้วแก้ `.gitignore` ก่อน

```bash
git add .
git commit -m "chore: initial project docs and configuration"
```

> ถ้าเผลอ commit ไฟล์ที่มี API key ไปแล้ว: **เปลี่ยน key ใหม่ทันที** อย่าแค่ลบไฟล์ —
> ประวัติ git ยังเก็บค่าเดิมไว้ และ key ที่ push ขึ้น GitHub ถือว่ารั่วแล้ว

---

## ขั้นที่ 2 — สร้าง repo บน GitHub แล้ว push

**แนะนำให้ตั้งเป็น private** (โปรเจกต์นี้ยังไม่มีอะไรต้องเปิดสาธารณะ)

```bash
gh repo create StockMonitor --private --source=. --remote=origin --push
```

หรือถ้าจะทำผ่านหน้าเว็บ: สร้าง repo เปล่า (ไม่ต้องติ๊ก README/`.gitignore`) แล้ว

```bash
git remote add origin https://github.com/<username>/StockMonitor.git
git push -u origin main
```

**เปิด secret scanning** (ฟรีทั้ง public และ private): Settings → Code security → เปิด *Secret scanning* + *Push protection*
ตัวนี้จะบล็อกไม่ให้ push API key ที่มันจำรูปแบบได้ — คุ้มมาก เปิดไว้เถอะ

---

## ขั้นที่ 3 — เตรียมบริการภายนอก (ทำก่อน deploy)

deploy ไปโดยยังไม่มีค่าพวกนี้ = build ผ่านแต่เว็บพัง ทำให้ครบก่อน

### 3.1 Postgres — Neon

1. neon.tech → สมัคร → Create project (ภูมิภาค **Singapore** ใกล้ไทยที่สุด)
2. เปิด SQL Editor รันคำสั่งนี้:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
3. คัดลอก connection string (แบบ **pooled**) → เก็บไว้เป็น `DATABASE_URL`

### 3.2 Redis — Upstash

1. upstash.com → Create Database → Region Singapore → Type **Regional**
2. คัดลอก `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

### 3.3 Anthropic API key

1. console.anthropic.com → เติมเงินขั้นต่ำ (~$5)
2. **ตั้ง budget alert ทันที** ที่ Settings → Limits — กันบิลบานปลาย
3. API Keys → Create Key → คัดลอกเก็บ (แสดงครั้งเดียว)

### 3.4 Market data keys

- finnhub.io → สมัครฟรี → คัดลอก API key
- twelvedata.com → สมัครฟรี → คัดลอก API key

### 3.5 สร้าง secret ของเราเอง

```bash
openssl rand -base64 32   # → NEXTAUTH_SECRET
openssl rand -hex 24      # → CRON_SECRET
```

---

## ขั้นที่ 4 — เชื่อม Vercel กับ GitHub

1. vercel.com → Sign up **ด้วย GitHub**
2. Add New → Project → เลือก repo `StockMonitor` → Import
3. Framework Preset: Next.js (ตรวจเจอเอง) — ปล่อย build command/output ตาม default
4. **ยังไม่ต้องกด Deploy** — ใส่ env ก่อน (ขั้นที่ 5)

> ⚠️ **Vercel Hobby ฟรี แต่ห้ามใช้เชิงพาณิชย์** — ถ้าเว็บมีโฆษณา/เก็บเงิน/ทำในนามบริษัท ต้องขึ้น Pro ($20/เดือน)
> ใช้ส่วนตัวหรือทำ portfolio อยู่บน Hobby ได้

---

## ขั้นที่ 5 — ใส่ Environment Variables

Vercel → Project → Settings → Environment Variables
ใส่ทีละตัว **แล้วติ๊ก environment ให้ถูก** (Production / Preview / Development)

| ตัวแปร | ค่า | Prod | Preview |
|--------|-----|:----:|:-------:|
| `DATABASE_URL` | จาก Neon | ✅ | ✅ (แนะนำใช้ Neon branch แยก) |
| `UPSTASH_REDIS_REST_URL` | จาก Upstash | ✅ | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | จาก Upstash | ✅ | ✅ |
| `ANTHROPIC_API_KEY` | จาก Anthropic | ✅ | ✅ |
| `AI_MODEL_PRIMARY` | `claude-opus-5` | ✅ | ✅ |
| `AI_MODEL_FAST` | `claude-haiku-4-5` | ✅ | ✅ |
| `AI_DAILY_REPORT_CAP` | `50` (prod) / `5` (preview) | ✅ | ✅ |
| `AI_USER_DAILY_CAP` | `10` | ✅ | ✅ |
| `USD_THB_RATE` | `33` | ✅ | ✅ |
| `FINNHUB_API_KEY` | จาก Finnhub | ✅ | ✅ |
| `TWELVEDATA_API_KEY` | จาก Twelve Data | ✅ | ✅ |
| `NEXTAUTH_SECRET` | ที่ generate ไว้ | ✅ | ✅ |
| `NEXTAUTH_URL` | `https://<โดเมนจริง>` | ✅ | ❌ (preview ใช้ auto) |
| `CRON_SECRET` | ที่ generate ไว้ | ✅ | ❌ |
| `NEXT_PUBLIC_SITE_URL` | URL ของเว็บ | ✅ | ✅ |
| `SENTRY_DSN` | (ทีหลังก็ได้) | ✅ | — |

**กฎ**
- ตัวไหนเป็นความลับ **ห้าม**ตั้งชื่อขึ้นต้น `NEXT_PUBLIC_` — Next.js จะฝังลงไฟล์ JS ที่ browser โหลดได้
- `AI_DAILY_REPORT_CAP` ของ preview ตั้งต่ำ ๆ ไว้ กันเผลอเผาเครดิตตอนเทส
- แก้ env แล้วต้อง **Redeploy** ถึงจะมีผล (Deployments → ⋯ → Redeploy)

**ทางลัด**: ใช้ Vercel CLI ดึง env ลงมาใช้ตอน dev ในเครื่อง

```bash
npm i -g vercel
vercel link
vercel env pull .env.local    # .env.local อยู่ใน .gitignore แล้ว ปลอดภัย
```

---

## ขั้นที่ 6 — Deploy ครั้งแรก + รัน migration

กด **Deploy** ใน Vercel (หรือ push ขึ้น `main` ก็ deploy เอง)

หลัง build เสร็จ **ต้องรัน migration เข้า DB** — ครั้งแรกรันจากเครื่องตัวเองได้เลย:

```bash
vercel env pull .env.local
npm run db:generate      # สร้างไฟล์ migration จาก schema
npm run db:migrate       # ยิงเข้า Neon
git add drizzle/ && git commit -m "chore: add initial migration" && git push
```

เช็คว่าขึ้นจริง:

```bash
curl https://<your-app>.vercel.app/api/health
# ต้องได้ {"data":{"status":"ok","db":"ok","redis":"ok",...}}
```

> **migration อัตโนมัติ**: พอ schema เริ่มนิ่งแล้ว ค่อยเพิ่ม GitHub Action ที่รัน `db:migrate` ก่อน deploy
> อย่าใส่ migration ไว้ใน build command — build รันหลายครั้งขนานกัน จะชนกัน

---

## ขั้นที่ 7 — Cron (ข้อจำกัดของ Hobby)

**Vercel Hobby: cron รันได้แค่วันละครั้ง** ซึ่งไม่พอสำหรับ ingest ข่าว/refresh candle/evaluate alert ที่ต้องถี่กว่านั้นมาก
ยิงถี่กว่านั้นผ่าน `vercel.json` โดยตรง **deploy จะ fail ทันที** ไม่ใช่แค่ cron เงียบ ๆ — เจอมาแล้วจริง (`vercel.json` ของโปรเจกต์นี้เลยไม่มี `crons` เลย)

ทางออกฟรี: ใช้ **GitHub Actions** ยิงเข้ามาแทนทั้งหมด แยกเป็น 2 workflow ตามความถี่ที่ต้องการ

```yaml
# .github/workflows/cron.yml — ทุก 5 นาที
name: cron-fast
on:
  schedule:
    - cron: '*/5 * * * *'     # Actions ไม่การันตีตรงเป๊ะ อาจคลาด 5-10 นาที
  workflow_dispatch:           # กดรันเองได้จากหน้า Actions
jobs:
  tick:
    runs-on: ubuntu-latest
    env:
      BASE: ${{ vars.BASE_URL }}
      CRON_SECRET: ${{ secrets.CRON_SECRET }}
    steps:
      - name: ingest news
        run: |
          curl -fsS -X POST "$BASE/api/cron/ingest-news" \
            -H "Authorization: Bearer $CRON_SECRET"
      - name: evaluate alerts
        run: |
          curl -fsS -X POST "$BASE/api/cron/evaluate-alerts" \
            -H "Authorization: Bearer $CRON_SECRET"
```

```yaml
# .github/workflows/cron-candles.yml — ทุก 15 นาที (ไม่ต้องถี่เท่าอีก 2 job)
name: cron-candles
on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:
jobs:
  tick:
    runs-on: ubuntu-latest
    env:
      BASE: ${{ vars.BASE_URL }}
      CRON_SECRET: ${{ secrets.CRON_SECRET }}
    steps:
      - name: refresh candles
        run: |
          curl -fsS -X POST "$BASE/api/cron/refresh-candles" \
            -H "Authorization: Bearer $CRON_SECRET"
```

ตั้งค่าที่ GitHub → Settings → Secrets and variables → Actions:
- Variables: `BASE_URL` = `https://<your-app>.vercel.app`
- Secrets: `CRON_SECRET` = ค่าเดียวกับใน Vercel

> **ไม่ต้องมี cron สำหรับบทวิเคราะห์ AI** — สร้างเมื่อผู้ใช้กดเท่านั้น ([docs/05 §7](05-AI-PIPELINE.md))

---

## ขั้นที่ 8 — โดเมนของตัวเอง (ถ้าต้องการ)

1. ซื้อโดเมน (Namecheap / Cloudflare ~350–500 บาท/ปี)
2. Vercel → Project → Settings → Domains → Add → พิมพ์โดเมน
3. Vercel บอก DNS record ที่ต้องตั้ง → ไปตั้งที่ผู้ให้บริการโดเมน
4. รอ propagate (ไม่กี่นาที–ชั่วโมง) SSL Vercel ออกให้อัตโนมัติ
5. อัปเดต `NEXTAUTH_URL` + `NEXT_PUBLIC_SITE_URL` → Redeploy

---

## ขั้นที่ 9 — วิธีทำงานประจำวันหลังจากนี้

```bash
git checkout -b feat/quote-header
# ...แก้โค้ด...
npm run typecheck && npm run lint && npm run test
git add . && git commit -m "feat(market): add quote header component"
git push -u origin feat/quote-header
gh pr create --fill
```

Vercel จะคอมเมนต์ preview URL ใน PR ให้อัตโนมัติ → เปิดดู → พอใจแล้ว merge เข้า `main` → deploy production เอง

**อย่า push ตรงเข้า `main`** — ตั้ง branch protection กันพลาด:
GitHub → Settings → Branches → Add rule → `main` → ติ๊ก *Require a pull request before merging*

---

## ขั้นที่ 10 — ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | แก้ |
|-------|--------|-----|
| Build fail `Module not found` | import path ผิด case (macOS ไม่สนตัวพิมพ์ แต่ Linux สน) | แก้ชื่อไฟล์/import ให้ตรงเป๊ะ |
| Build ผ่านแต่หน้าเว็บ error 500 | env ขาด | Vercel → Deployments → Runtime Logs อ่าน error จริง |
| `/api/health` บอก `db: error` | ลืมรัน migration / connection string ผิด / ไม่ได้เปิด extension | รัน `db:migrate`, เช็ค `DATABASE_URL` เป็นแบบ pooled |
| Timeout ตอนสร้างบทวิเคราะห์ | Hobby จำกัด function 10 วิ (Pro 60 วิ) | ใส่ `export const maxDuration = 60` + ใช้ streaming; ถ้าอยู่ Hobby ต้องขึ้น Pro หรือย้าย job ออก |
| แก้ env แล้วไม่มีผล | env อ่านตอน build | Redeploy |
| Preview ใช้ DB ตัวเดียวกับ prod | ตั้ง env ตัวเดียวใช้ทุก environment | แยก `DATABASE_URL` ของ Preview ไป Neon branch อื่น |
| บิล Anthropic พุ่ง | cap ไม่ได้ตั้ง / มีคนกดรัว | เช็ค `AI_DAILY_REPORT_CAP`, `AI_USER_DAILY_CAP`, บังคับ login ก่อนกดสร้าง |

**อ่าน log ที่ไหน**
- Build error → Vercel → Deployments → เลือก deployment → Building
- Runtime error → Deployments → Runtime Logs (หรือ Sentry ถ้าต่อแล้ว)

---

## สรุปเป็นเช็คลิสต์

- [ ] `git init` + commit แรก (ไม่มี `.env` หลุด)
- [ ] push ขึ้น GitHub (private) + เปิด secret scanning
- [ ] Neon: สร้าง DB + `CREATE EXTENSION vector, pg_trgm`
- [ ] Upstash: สร้าง Redis
- [ ] Anthropic: เติมเงิน + **ตั้ง budget alert** + สร้าง key
- [ ] Finnhub / Twelve Data: สมัคร + เอา key
- [ ] generate `NEXTAUTH_SECRET`, `CRON_SECRET`
- [ ] Vercel: import repo + ใส่ env ครบ (ไม่มีความลับใน `NEXT_PUBLIC_`)
- [ ] Deploy + รัน migration + `/api/health` เขียว
- [ ] GitHub Actions cron + `BASE_URL` / `CRON_SECRET`
- [ ] branch protection บน `main`
- [ ] (ถ้ามี) โดเมน + อัปเดต `NEXTAUTH_URL`
- [ ] ผ่าน production checklist ใน [docs/08 §6](08-DEPLOYMENT.md#6-production-checklist)
