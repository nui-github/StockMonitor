import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QuoteRow, type QuoteRowData } from "@/components/market/QuoteRow";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";

// ข้อมูลตัวอย่าง — ยังไม่เชื่อม provider จริง (Phase 1 ดู docs/09-ROADMAP.md)
const mockStocks: QuoteRowData[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 231.45, changePct: 1.01, currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 138.72, changePct: -0.84, currency: "USD" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 412.9, changePct: 3.42, currency: "USD" },
];

const mockEtfs: QuoteRowData[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 612.3, changePct: 0.32, currency: "USD" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", price: 524.11, changePct: 0.58, currency: "USD" },
];

const mockCommodities: QuoteRowData[] = [
  { symbol: "XAUUSD", name: "ทองคำ (Spot Gold)", price: 3421.6, changePct: 0.19, currency: "USD" },
  { symbol: "WTI", name: "น้ำมัน WTI", price: 71.85, changePct: -1.12, currency: "USD" },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">ภาพรวมตลาด</h1>
          <p className="mt-1 text-sm text-fg-subtle">อัปเดตล่าสุด — ข้อมูลตัวอย่างสำหรับพรีวิว UI</p>
        </div>
        <div className="flex items-center gap-2">
          <MarketStatusPill state="open" />
          <Badge tone="accent">ตัวอย่าง UI — ยังไม่เชื่อมข้อมูลจริง</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>หุ้นรายตัว</CardTitle>
            <Badge tone="neutral">US</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            {mockStocks.map((q) => (
              <QuoteRow key={q.symbol} {...q} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ETF</CardTitle>
            <Badge tone="neutral">US</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            {mockEtfs.map((q) => (
              <QuoteRow key={q.symbol} {...q} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commodity</CardTitle>
            <Badge tone="neutral">Spot</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            {mockCommodities.map((q) => (
              <QuoteRow key={q.symbol} {...q} />
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-fg-subtle">
        ข้อมูลและบทวิเคราะห์บนเว็บไซต์นี้จัดทำเพื่อการศึกษาเท่านั้น ไม่ถือเป็นคำแนะนำการลงทุน
      </p>
    </AppShell>
  );
}
