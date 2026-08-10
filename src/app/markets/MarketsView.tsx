"use client";

import { useMemo, useState } from "react";
import { INSTRUMENT_SEED } from "@/lib/config/instruments-seed";
import { useQuotes } from "@/hooks/useQuotes";
import { QuoteRow } from "@/components/market/QuoteRow";
import { Tabs, type TabOption } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { AssetClass } from "@/types/market";

const TAB_OPTIONS: TabOption<AssetClass | "all">[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "stock", label: "หุ้น" },
  { value: "etf", label: "ETF" },
  { value: "commodity", label: "Commodity" },
];

export function MarketsView() {
  const [tab, setTab] = useState<AssetClass | "all">("all");

  const filtered = useMemo(
    () => INSTRUMENT_SEED.filter((i) => tab === "all" || i.assetClass === tab),
    [tab],
  );
  const symbols = useMemo(() => filtered.map((i) => i.symbol), [filtered]);

  const { data, isLoading, error, refetch } = useQuotes(symbols);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-fg">ตลาด</h1>
        <p className="mt-1 text-sm text-fg-subtle">ราคาสินทรัพย์ทุกประเภทที่ระบบติดตาม</p>
      </div>

      <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} />

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <ErrorState
          message="ดึงราคาไม่สำเร็จ"
          code={error instanceof Error ? error.message : "PROVIDER_UNAVAILABLE"}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState title="ไม่มีสินทรัพย์ในหมวดนี้" />
      )}

      {!isLoading && !error && data && (
        <div className="rounded-lg border border-border bg-surface-1">
          {filtered.map((instrument) => {
            const quote = data.quotes.find((q) => q.symbol === instrument.symbol);
            const failed = data.failedSymbols.includes(instrument.symbol);

            if (!quote) {
              return (
                <div
                  key={instrument.symbol}
                  className="flex items-center justify-between gap-4 border-b border-border-soft px-3 py-2.5 last:border-0"
                >
                  <div>
                    <div className="font-mono text-sm font-medium text-fg">{instrument.symbol}</div>
                    <div className="text-xs text-fg-subtle">{instrument.nameTh}</div>
                  </div>
                  <span className="text-xs text-fg-subtle">{failed ? "ไม่พร้อมใช้งาน" : "—"}</span>
                </div>
              );
            }

            return (
              <QuoteRow
                key={instrument.symbol}
                symbol={instrument.symbol}
                name={instrument.nameTh}
                price={quote.price}
                changePct={quote.changePct}
                currency={quote.currency}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
