"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuoteRow } from "@/components/market/QuoteRow";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { useQuotes } from "@/hooks/useQuotes";
import { INSTRUMENT_SEED } from "@/lib/config/instruments-seed";
import type { AssetClass } from "@/types/market";

function useBoard(assetClass: AssetClass, quotes: ReturnType<typeof useQuotes>["data"]) {
  const instruments = INSTRUMENT_SEED.filter((i) => i.assetClass === assetClass);
  return instruments.map((instrument) => ({
    instrument,
    quote: quotes?.quotes.find((q) => q.symbol === instrument.symbol) ?? null,
  }));
}

function Board({
  title,
  badge,
  rows,
  isLoading,
}: {
  title: string;
  badge: string;
  rows: { instrument: (typeof INSTRUMENT_SEED)[number]; quote: ReturnType<typeof useBoard>[number]["quote"] }[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Badge tone="neutral">{badge}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {isLoading &&
          rows.map((r) => <Skeleton key={r.instrument.symbol} className="h-12 w-full" />)}

        {!isLoading &&
          rows.map(({ instrument, quote }) =>
            quote ? (
              <QuoteRow
                key={instrument.symbol}
                symbol={instrument.symbol}
                name={instrument.nameTh}
                price={quote.price}
                changePct={quote.changePct}
                currency={quote.currency}
              />
            ) : (
              <div key={instrument.symbol} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <div className="font-mono text-sm text-fg">{instrument.symbol}</div>
                  <div className="text-xs text-fg-subtle">{instrument.nameTh}</div>
                </div>
                <span className="text-xs text-fg-subtle">ไม่พร้อมใช้งาน</span>
              </div>
            ),
          )}
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  const allSymbols = useMemo(() => INSTRUMENT_SEED.map((i) => i.symbol), []);
  const { data, isLoading, error, refetch } = useQuotes(allSymbols, { refetchIntervalMs: 10_000 });

  const stocks = useBoard("stock", data);
  const etfs = useBoard("etf", data);
  const commodities = useBoard("commodity", data);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">ภาพรวมตลาด</h1>
          <p className="mt-1 text-sm text-fg-subtle">ราคาอัปเดตอัตโนมัติทุก 10 วินาที</p>
        </div>
        <MarketStatusPill state="open" />
      </div>

      {!isLoading && error && (
        <ErrorState
          message="ดึงราคาตลาดไม่สำเร็จ"
          code={error instanceof Error ? error.message : "PROVIDER_UNAVAILABLE"}
          onRetry={() => refetch()}
        />
      )}

      {(isLoading || !error) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Board title="หุ้นรายตัว" badge="US" rows={stocks} isLoading={isLoading} />
          <Board title="ETF" badge="US" rows={etfs} isLoading={isLoading} />
          <Board title="Commodity" badge="Spot" rows={commodities} isLoading={isLoading} />
        </div>
      )}

      <p className="mt-8 text-center text-xs text-fg-subtle">
        ข้อมูลและบทวิเคราะห์บนเว็บไซต์นี้จัดทำเพื่อการศึกษาเท่านั้น ไม่ถือเป็นคำแนะนำการลงทุน
      </p>
    </div>
  );
}
