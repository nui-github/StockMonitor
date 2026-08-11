"use client";

import type { Session } from "next-auth";
import { Briefcase, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PortfolioForm } from "@/components/portfolio/PortfolioForm";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuotes } from "@/hooks/useQuotes";
import { calcHoldingPL } from "@/lib/services/portfolio-calc";
import { cn } from "@/lib/utils/cn";

function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function PortfolioView({ session }: { session: Session | null }) {
  const isLoggedIn = Boolean(session?.user);
  const { data: holdings, isLoading, error, refetch, add, remove } = usePortfolio(isLoggedIn);

  const symbols = [...new Set((holdings ?? []).map((h) => h.symbol))];
  const { data: quoteData, isLoading: quotesLoading, error: quotesError } = useQuotes(symbols);

  if (!isLoggedIn) {
    return <EmptyState icon={Briefcase} title="กรุณาเข้าสู่ระบบ" description="เข้าสู่ระบบเพื่อติดตามพอร์ตการลงทุนของคุณ" />;
  }

  const priceBySymbol = new Map((quoteData?.quotes ?? []).map((q) => [q.symbol, q]));

  const rows = (holdings ?? []).map((h) => {
    const quote = priceBySymbol.get(h.symbol);
    const pl = quote ? calcHoldingPL(h, quote.price) : null;
    return { holding: h, quote, pl };
  });

  const totals = rows.reduce(
    (acc, r) => {
      if (!r.pl) return acc;
      acc.costValue += r.pl.costValue;
      acc.currentValue += r.pl.currentValue;
      return acc;
    },
    { costValue: 0, currentValue: 0 },
  );
  const totalPl = totals.currentValue - totals.costValue;
  const totalPlPct = totals.costValue !== 0 ? (totalPl / totals.costValue) * 100 : 0;
  const hasAnyPricedRow = rows.some((r) => r.pl !== null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-fg">พอร์ตการลงทุน</h1>
        <p className="mt-1 text-sm text-fg-subtle">กรอกจำนวนหน่วยและต้นทุนเอง ไม่ผูกกับโบรกเกอร์</p>
      </div>

      {holdings && holdings.length > 0 && hasAnyPricedRow && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>มูลค่าปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xl tabular-nums text-fg">{formatNumber(totals.currentValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>ต้นทุนรวม</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xl tabular-nums text-fg">{formatNumber(totals.costValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>กำไร/ขาดทุน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("font-mono text-xl tabular-nums", totalPl >= 0 ? "text-up" : "text-down")}>
                {totalPl >= 0 ? "+" : ""}
                {formatNumber(totalPl)}
                <span className="ml-1 text-sm">
                  ({totalPl >= 0 ? "+" : ""}
                  {formatNumber(totalPlPct)}%)
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <PortfolioForm onSubmit={(input) => add.mutate(input)} isSubmitting={add.isPending} />
      {add.isError && <p className="text-xs text-down">{add.error instanceof Error ? add.error.message : "เพิ่มรายการไม่สำเร็จ"}</p>}

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <ErrorState message="ดึงพอร์ตไม่สำเร็จ" code={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
      )}

      {!isLoading && !error && holdings && holdings.length === 0 && (
        <EmptyState icon={Briefcase} title="ยังไม่มีรายการในพอร์ต" description="เพิ่มรายการแรกด้านบน" />
      )}

      {!isLoading && !error && holdings && holdings.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs text-fg-subtle">
                <th className="px-3 py-2 font-normal">สินทรัพย์</th>
                <th className="px-3 py-2 text-right font-normal">จำนวน</th>
                <th className="px-3 py-2 text-right font-normal">ต้นทุน/หน่วย</th>
                <th className="px-3 py-2 text-right font-normal">ราคาปัจจุบัน</th>
                <th className="px-3 py-2 text-right font-normal">กำไร/ขาดทุน</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ holding, quote, pl }) => (
                <tr key={holding.id} className="group border-b border-border-soft last:border-0">
                  <td className="px-3 py-2.5 font-mono text-fg">{holding.symbol}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-fg-muted">{formatNumber(Number(holding.quantity), 4)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-fg-muted">{formatNumber(Number(holding.costBasis))}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-fg-muted">
                    {quotesLoading ? "…" : quote ? formatNumber(quote.price) : quotesError ? "ผิดพลาด" : "—"}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono tabular-nums", pl ? (pl.pl >= 0 ? "text-up" : "text-down") : "text-fg-subtle")}>
                    {pl ? `${pl.pl >= 0 ? "+" : ""}${formatNumber(pl.pl)} (${pl.plPct >= 0 ? "+" : ""}${formatNumber(pl.plPct)}%)` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => remove.mutate(holding.id)}
                      aria-label={`ลบ ${holding.symbol} ออกจากพอร์ต`}
                      className="rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:bg-surface-3 hover:text-down focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
