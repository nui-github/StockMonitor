"use client";

import { useState } from "react";
import { GitCompare, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ChartToolbar } from "@/components/chart/ChartToolbar";
import { CompareChart, COMPARE_COLORS, type CompareSeries } from "@/components/chart/CompareChart";
import { AddSymbolDialog } from "@/components/watchlist/AddSymbolDialog";
import { useCompareCandles } from "@/hooks/useCompareCandles";
import { cn } from "@/lib/utils/cn";
import type { RangeKey } from "@/types/market";

const MAX_SYMBOLS = 5;

export function CompareView() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [range, setRange] = useState<RangeKey>("6mo");
  const [dialogOpen, setDialogOpen] = useState(false);

  const queries = useCompareCandles(symbols, range);
  const isLoading = queries.length > 0 && queries.every((q) => q.isLoading);
  const allFailed = queries.length > 0 && queries.every((q) => q.isError);

  const handleAdd = (symbol: string) => {
    if (symbols.includes(symbol) || symbols.length >= MAX_SYMBOLS) return;
    setSymbols((prev) => [...prev, symbol]);
  };

  const handleRemove = (symbol: string) => setSymbols((prev) => prev.filter((s) => s !== symbol));

  const series: CompareSeries[] = symbols
    .map((symbol, i) => {
      const candles = queries[i]?.data?.candles ?? [];
      return { symbol, color: COMPARE_COLORS[i % COMPARE_COLORS.length], candles };
    })
    .filter((s) => s.candles.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">เปรียบเทียบสินทรัพย์</h1>
          <p className="mt-1 text-sm text-fg-subtle">เทียบผลตอบแทน % จากจุดเริ่มต้นของแต่ละสินทรัพย์ สูงสุด {MAX_SYMBOLS} ตัว</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={symbols.length >= MAX_SYMBOLS}>
          <Plus size={14} aria-hidden="true" />
          เพิ่มสินทรัพย์
        </Button>
      </div>

      {symbols.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {symbols.map((symbol, i) => {
            const q = queries[i];
            const candles = q?.data?.candles ?? [];
            const base = candles[0]?.c;
            const last = candles[candles.length - 1]?.c;
            const pct = base && last ? ((last - base) / base) * 100 : null;
            const color = COMPARE_COLORS[i % COMPARE_COLORS.length];

            return (
              <div
                key={symbol}
                className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-3 pr-1.5 text-sm"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="font-mono text-fg">{symbol}</span>
                {q?.isLoading && <span className="text-xs text-fg-subtle">…</span>}
                {q?.isError && <span className="text-xs text-down">ผิดพลาด</span>}
                {pct !== null && (
                  <span className={cn("font-mono text-xs tabular-nums", pct >= 0 ? "text-up" : "text-down")}>
                    {pct >= 0 ? "+" : ""}
                    {pct.toFixed(2)}%
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(symbol)}
                  aria-label={`เอา ${symbol} ออกจากการเปรียบเทียบ`}
                  className="rounded-full p-0.5 text-fg-subtle transition-colors hover:bg-surface-3 hover:text-down"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ผลตอบแทนเทียบ %</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <ChartToolbar range={range} onRangeChange={setRange} />

          {symbols.length === 0 && (
            <EmptyState
              icon={GitCompare}
              title="ยังไม่มีสินทรัพย์ที่เปรียบเทียบ"
              description="เพิ่มสินทรัพย์อย่างน้อย 2 ตัวเพื่อดูกราฟผลตอบแทนเทียบกัน"
              action={
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                  <Plus size={14} aria-hidden="true" />
                  เพิ่มสินทรัพย์แรก
                </Button>
              }
            />
          )}

          {symbols.length > 0 && isLoading && <Skeleton className="h-[360px] w-full" />}

          {symbols.length > 0 && !isLoading && allFailed && (
            <ErrorState message="ดึงข้อมูลกราฟไม่สำเร็จทั้งหมด" code="PROVIDER_UNAVAILABLE" />
          )}

          {symbols.length > 0 && !isLoading && !allFailed && series.length === 0 && (
            <EmptyState title="ยังไม่มีข้อมูลกราฟ" description="ลองเลือกช่วงเวลาอื่น หรือรอสักครู่" />
          )}

          {series.length > 0 && <CompareChart series={series} />}
        </CardContent>
      </Card>

      <AddSymbolDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
        selectedSymbols={symbols}
        title="เพิ่มสินทรัพย์เพื่อเปรียบเทียบ"
      />
    </div>
  );
}
