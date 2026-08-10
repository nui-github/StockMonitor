"use client";

import { useEffect, useState } from "react";
import { Plus, Star, X } from "lucide-react";
import { useWatchlistStore } from "@/stores/watchlist";
import { useQuotes } from "@/hooks/useQuotes";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuoteRow } from "@/components/market/QuoteRow";
import { AddSymbolDialog } from "@/components/watchlist/AddSymbolDialog";

export function WatchlistView() {
  const [hasMounted, setHasMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { symbols, remove } = useWatchlistStore();

  // zustand persist โหลดจาก localStorage หลัง mount — กัน hydration mismatch
  useEffect(() => setHasMounted(true), []);

  const { data, isLoading, error, refetch } = useQuotes(hasMounted ? symbols : []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">ติดตาม</h1>
          <p className="mt-1 text-sm text-fg-subtle">รายการสินทรัพย์ที่คุณติดตาม (เก็บในเครื่องนี้)</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={14} aria-hidden="true" />
          เพิ่มสินทรัพย์
        </Button>
      </div>

      {!hasMounted && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {hasMounted && symbols.length === 0 && (
        <EmptyState
          icon={Star}
          title="ยังไม่มีสินทรัพย์ที่ติดตาม"
          description="กดเพิ่มสินทรัพย์เพื่อเริ่มติดตามราคา"
          action={
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus size={14} aria-hidden="true" />
              เพิ่มสินทรัพย์แรก
            </Button>
          }
        />
      )}

      {hasMounted && symbols.length > 0 && isLoading && (
        <div className="flex flex-col gap-2">
          {symbols.map((s) => (
            <Skeleton key={s} className="h-14 w-full" />
          ))}
        </div>
      )}

      {hasMounted && symbols.length > 0 && !isLoading && error && (
        <ErrorState
          message="ดึงราคาไม่สำเร็จ"
          code={error instanceof Error ? error.message : "PROVIDER_UNAVAILABLE"}
          onRetry={() => refetch()}
        />
      )}

      {hasMounted && symbols.length > 0 && !isLoading && !error && data && (
        <div className="rounded-lg border border-border bg-surface-1">
          {symbols.map((symbol) => {
            const quote = data.quotes.find((q) => q.symbol === symbol);
            const failed = data.failedSymbols.includes(symbol);

            return (
              <div key={symbol} className="group relative border-b border-border-soft last:border-0">
                {quote ? (
                  <QuoteRow symbol={symbol} name={symbol} price={quote.price} changePct={quote.changePct} currency={quote.currency} />
                ) : (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="font-mono text-sm text-fg">{symbol}</span>
                    <span className="text-xs text-fg-subtle">{failed ? "ไม่พร้อมใช้งาน" : "—"}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => remove(symbol)}
                  aria-label={`เอา ${symbol} ออกจากรายการติดตาม`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:bg-surface-3 hover:text-down group-hover:opacity-100"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddSymbolDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
