# 06 — Design System (Dark · Minimal · Futuristic)

## 1. หลักการ

1. **ข้อมูลนำ ตกแต่งตาม** — ตัวเลขคือพระเอก, chrome ต้องเงียบ
2. **ดำไม่สนิท** — พื้นหลัง `#05070A` ไม่ใช้ `#000` (ลดขอบตัดตา, ไล่เฉดได้)
3. **สีคือความหมาย** — เขียว/แดง สงวนไว้ให้ทิศทางราคาเท่านั้น, accent ใช้ทีละที่
4. **เส้นบางแทนกล่องหนัก** — border 1px opacity ต่ำ + เงาเรือง (glow) แทน drop shadow
5. **Motion 120–200ms** ease-out เท่านั้น; เคารพ `prefers-reduced-motion`
6. **แตะได้จริง** — hit area ≥ 44px, contrast ≥ 4.5:1 สำหรับข้อความ

## 2. Tokens (Tailwind v4 · `globals.css`)

```css
@import "tailwindcss";

@theme {
  /* surface */
  --color-bg:        #05070A;
  --color-surface-1: #0A0E14;
  --color-surface-2: #101620;
  --color-surface-3: #16202C;
  --color-border:    #1C2733;
  --color-border-soft: #131B24;

  /* text */
  --color-fg:        #E8EDF4;
  --color-fg-muted:  #93A1B3;
  --color-fg-subtle: #5C6A7D;

  /* semantic */
  --color-up:        #10E098;   /* ราคาขึ้น */
  --color-down:      #FF4D6A;   /* ราคาลง */
  --color-flat:      #93A1B3;
  --color-accent:    #22D3EE;   /* cyan — highlight/focus */
  --color-accent-dim:#0E7490;
  --color-warn:      #FBBF24;

  /* typography */
  --font-sans: "Noto Sans Thai", "Noto Sans", ui-sans-serif, system-ui;
  --font-mono: "Noto Sans Mono", ui-monospace, monospace;

  /* radius / shadow */
  --radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;
  --shadow-glow: 0 0 0 1px rgb(34 211 238 / .18), 0 0 24px -6px rgb(34 211 238 / .28);
  --shadow-card: 0 1px 0 0 rgb(255 255 255 / .03) inset, 0 8px 24px -12px rgb(0 0 0 / .8);
}
```

> เว็บเป็น dark-only ตาม requirement — ถ้าจะเพิ่ม light mode ภายหลัง ให้ย้าย token ไป `:root[data-theme]`

## 3. Font (Noto, default ไทย)

```tsx
// src/app/layout.tsx
import { Noto_Sans_Thai, Noto_Sans, Noto_Sans_Mono } from 'next/font/google';

const notoThai = Noto_Sans_Thai({ subsets: ['thai','latin'], weight: ['400','500','600','700'], variable: '--font-noto-thai', display: 'swap' });
const notoSans = Noto_Sans({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-noto-sans', display: 'swap' });
const notoMono = Noto_Sans_Mono({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-noto-mono', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${notoThai.variable} ${notoSans.variable} ${notoMono.variable} dark`}>
      <body className="bg-bg text-fg font-sans antialiased">{children}</body>
    </html>
  );
}
```

**กฎการใช้ฟอนต์**
- ข้อความทั่วไป/ไทย → `font-sans` (Noto Sans Thai)
- **ตัวเลขทุกตัวที่เป็นราคา/เปอร์เซ็นต์/ปริมาณ** → `font-mono` + `tabular-nums` (กันตัวเลขเต้นตอน realtime)

```tsx
<span className="font-mono tabular-nums tracking-tight">231.45</span>
```

## 4. Type scale

| ระดับ | ขนาด/line-height | ใช้กับ |
|------|------------------|--------|
| Display | 40/44, 600 | ราคาใหญ่หน้า symbol |
| H1 | 28/34, 600 | ชื่อหน้า |
| H2 | 20/28, 600 | หัวข้อ section |
| Body | 15/24, 400 | เนื้อความ (ไทยอ่านง่ายที่ 15–16px) |
| Label | 13/18, 500 | ป้าย/หัวตาราง |
| Caption | 12/16, 400, `fg-subtle` | timestamp, แหล่งอ้างอิง |

## 5. สีทิศทางราคา

```
ขึ้น  text-up    bg-up/10    border-up/30
ลง    text-down  bg-down/10  border-down/30
เท่า  text-flat
```
- ต้องมี **สัญลักษณ์ร่วมเสมอ** (▲ ▼ จาก lucide `TrendingUp` / `TrendingDown`) — ไม่พึ่งสีอย่างเดียว (colorblind)
- Flash on tick: ไฮไลต์พื้นหลัง 180ms แล้วจาง (ปิดเมื่อ `prefers-reduced-motion`)

## 6. Component inventory

| กลุ่ม | Component |
|------|-----------|
| ui | Button, IconButton, Card, Badge, Tabs, Tooltip, Dialog, Sheet, Skeleton, Table, Select, Input, Switch, Toast, EmptyState, ErrorState |
| market | QuoteHeader, PriceTicker, ChangePill, StatGrid, MarketStatusPill, AssetIcon, SymbolSearch |
| chart | PriceChart, ChartToolbar (timeframe/type), IndicatorPanel, MiniSparkline, CompareChart |
| analysis | AiReportCard, SentimentGauge, BullBearSplit, DriverList, CitationChip, ConfidenceMeter, DisclaimerBar, **GenerateReportButton**, **CostWarningDialog**, **GeneratingState**, **UsageMeter**, **CostFootnote** |
| news | NewsList, NewsItem, SourceBadge (สีตาม tier), NewsFilter |
| layout | AppShell, Sidebar, TopBar, CommandPalette (⌘K), Footer |

## 7. Icons — lucide-react

```tsx
import { TrendingUp, TrendingDown, Search, Star, Bell, LineChart, Sparkles, ExternalLink } from 'lucide-react';
```
กติกา: `size={16}` ในข้อความ / `size={20}` ปุ่ม, `strokeWidth={1.75}`, ห้ามใช้ไอคอนโดยไม่มี `aria-label` เมื่อไม่มีข้อความกำกับ

## 8. Layout

- Grid หลัก: `max-w-[1440px]`, gutter 24px (desktop) / 16px (mobile)
- หน้า `/s/[symbol]`: desktop 2 คอลัมน์ `minmax(0,1fr) 380px` (กราฟซ้าย / AI+ข่าวขวา), mobile ซ้อนแนวตั้ง + tab
- Breakpoints: `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`
- Sidebar ยุบเป็นไอคอนที่ < `lg`, เป็น bottom nav ที่ < `md`

## 9. Chart

- ไลบรารี: **lightweight-charts** (TradingView) — เบา, ทำ dark ได้เนียน
- theme กราฟ: bg โปร่ง, grid `#131B24`, crosshair `--color-accent` เส้นประ, แท่งขึ้น `--color-up` ลง `--color-down`
- Volume เป็น histogram แถวล่าง 20% ของสูง, RSI/MACD เป็น panel แยก toggle ได้

## 10. States (บังคับทุก component ที่โหลดข้อมูล)

| State | รูปแบบ |
|-------|--------|
| loading | Skeleton รูปทรงเดียวกับของจริง (ห้าม spinner กลางจอ) |
| empty | ไอคอน + 1 บรรทัดอธิบาย + ปุ่ม action |
| error | ข้อความไทยเข้าใจง่าย + ปุ่ม "ลองใหม่" + รหัส error เล็ก ๆ |
| stale | badge "ข้อมูลล่าช้า • อัปเดตเมื่อ HH:mm" สี `warn` |

## 11. Pattern: การกระทำที่มีค่าใช้จ่าย (cost-incurring action)

ใช้กับปุ่มสร้างบทวิเคราะห์ AI และปุ่มอื่นใดที่เรียก paid API ในอนาคต

**หลักการ**: ผู้ใช้ต้องรู้ก่อนว่าจะเสียเท่าไร และต้องกดยืนยันด้วยความตั้งใจ ไม่ใช่กดพลาด

| องค์ประกอบ | ข้อกำหนด |
|-----------|---------|
| ปุ่ม | มีไอคอน `Sparkles` + ป้ายราคาข้าง ๆ `~1.5 ฿` สี `fg-subtle` ขนาด caption |
| สีปุ่ม | ใช้ `accent` outline **ไม่ใช่** ปุ่มทึบ — สื่อว่าเป็นการกระทำที่ต้องคิด ไม่ใช่ปุ่มหลักที่กดเล่น |
| Dialog | ตัวเลขราคาเป็น `font-mono` + คำว่า "โดยประมาณ" ติดเสมอ + แถบโควตาคงเหลือ |
| ปุ่มยืนยัน | อยู่ขวา ไม่ autofocus ข้อความชัดเจน "ยืนยันและสร้าง" ไม่ใช่ "ตกลง" |
| ปุ่มยกเลิก | อยู่ซ้าย เป็น ghost, `Esc` ปิดได้ |
| ระหว่างทำงาน | `GeneratingState` — progress bar indeterminate + ข้อความ "กำลังวิเคราะห์… 20–40 วินาที" + ปุ่ม "ยกเลิก" |
| หลังเสร็จ | `CostFootnote` ใต้ report: "ใช้ไป 1.50 ฿ • สร้างเมื่อ 14:32 • โมเดล มาตรฐาน" |
| เกินโควตา | ปุ่ม disabled + tooltip บอกเวลารีเซ็ต — ห้ามซ่อนปุ่ม (ผู้ใช้ต้องรู้ว่าฟีเจอร์มีอยู่) |

**สิ่งที่ห้ามทำ**
- ❌ auto-generate ตอนโหลดหน้า / ตอน hover / ตอน prefetch
- ❌ ปุ่มยืนยันเป็น default focus (กด Enter รัว ๆ แล้วเสียเงิน)
- ❌ ซ่อนราคาไว้หลัง tooltip หรือ "ดูรายละเอียด"
- ❌ ใช้คำกำกวมอย่าง "อาจมีค่าใช้จ่าย" — ต้องบอกตัวเลข

## 12. Accessibility

- ทุก interactive มี `:focus-visible` ring `--color-accent` 2px offset 2px
- ราคาที่เปลี่ยนแบบ realtime อยู่ใน `aria-live="polite"` (throttle ประกาศทุก 10 วิ ไม่ประกาศทุก tick)
- ตารางใช้ `<table>` จริง + `<caption>` ซ่อน
- แตะเป้าหมาย ≥ 44×44
- รองรับ keyboard เต็ม: `/` โฟกัสค้นหา, `⌘K` command palette, `Esc` ปิด overlay
