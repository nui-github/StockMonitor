"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Star, X } from "lucide-react";
import type { Session } from "next-auth";
import { useWatchlistStore } from "@/stores/watchlist";
import { useDbWatchlist } from "@/hooks/useWatchlist";
import { useQuotes } from "@/hooks/useQuotes";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuoteRow } from "@/components/market/QuoteRow";
import { AddSymbolDialog } from "@/components/watchlist/AddSymbolDialog";

export function WatchlistView({ session }: { session: Session | null }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isLoggedIn = Boolean(session?.user);

  const localStore = useWatchlistStore();
  const db = useDbWatchlist(isLoggedIn);
  const mergedRef = useRef(false);

  // zustand persist โหลดจาก localStorage หลัง mount — กัน hydration mismatch
  useEffect(() => setHasMounted(true), []);

  // login ครั้งแรก: ย้าย symbol จาก localStorage (guest) เข้า DB ครั้งเดียว
  useEffect(() => {
    if (!isLoggedIn || !hasMounted || mergedRef.current || !db.data) return;
    mergedRef.current = true;

    const toMerge = localStore.symbols.filter((s) => !db.data!.includes(s));
    toMerge.forEach((symbol) => db.add.mutate(symbol));
  }, [isLoggedIn, hasMounted, db.data, db.add, localStore.symbols]);

  const symbols = isLoggedIn ? (db.data ?? []) : localStore.symbols;
  const isLoading = isLoggedIn ? db.isLoading : !hasMounted;
  const error = isLoggedIn ? db.error : null;

  const { data, isLoading: quotesLoading, error: quotesError, refetch } = useQuotes(symbols);

  const handleAdd = (symbol: string) => (isLoggedIn ? db.add.mutate(symbol) : localStore.add(symbol));
  const handleRemove = (symbol: string) => (isLoggedIn ? db.remove.mutate(symbol) : localStore.remove(symbol));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">ติดตาม</h1>
          <p className="mt-1 text-sm text-fg-subtle">
            {isLoggedIn ? "รายการสินทรัพย์ที่คุณติดตาม (ซิงก์กับบัญชี)" : "รายการสินทรัพย์ที่คุณติดตาม (เก็บในเครื่องนี้)"}
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={14} aria-hidden="true" />
          เพิ่มสินทรัพย์
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <ErrorState message="ดึงรายการติดตามไม่สำเร็จ" code={error instanceof Error ? error.message : undefined} />
      )}

      {!isLoading && !error && symbols.length === 0 && (
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

      {!isLoading && !error && symbols.length > 0 && quotesLoading && (
        <div className="flex flex-col gap-2">
          {symbols.map((s) => (
            <Skeleton key={s} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !error && symbols.length > 0 && !quotesLoading && quotesError && (
        <ErrorState
          message="ดึงราคาไม่สำเร็จ"
          code={quotesError instanceof Error ? quotesError.message : "PROVIDER_UNAVAILABLE"}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && symbols.length > 0 && !quotesLoading && !quotesError && data && (
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
                  onClick={() => handleRemove(symbol)}
                  aria-label={`เอา ${symbol} ออกจากรายการติดตาม`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:bg-surface-3 hover:text-down focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddSymbolDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdd={handleAdd} selectedSymbols={symbols} />
    </div>
  );
}
