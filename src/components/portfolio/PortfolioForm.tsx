"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSearch } from "@/hooks/useSearch";

export function PortfolioForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (input: { symbol: string; quantity: number; costBasis: number }) => void;
  isSubmitting: boolean;
}) {
  const [query, setQuery] = useState("");
  const [symbol, setSymbol] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [costBasis, setCostBasis] = useState("");

  const { data: results, isLoading } = useSearch(query, query.length > 0 && !symbol);

  const qtyNum = Number(quantity);
  const costNum = Number(costBasis);
  const canSubmit = Boolean(symbol) && Number.isFinite(qtyNum) && qtyNum > 0 && Number.isFinite(costNum) && costNum > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !canSubmit) return;
    onSubmit({ symbol, quantity: qtyNum, costBasis: costNum });
    setSymbol(null);
    setQuery("");
    setQuantity("");
    setCostBasis("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 p-4">
      {symbol ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2">
          <span className="font-mono text-sm text-fg">{symbol}</span>
          <button type="button" onClick={() => setSymbol(null)} className="text-xs text-fg-subtle hover:text-fg">
            เปลี่ยน
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาหุ้น, ETF, ทองคำ…"
            aria-label="ค้นหาสินทรัพย์เพื่อเพิ่มเข้าพอร์ต"
            className="h-10 w-full rounded-md border border-border bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle outline-none focus-visible:border-accent"
          />
          {query.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface-1 shadow-[var(--shadow-card)]">
              {isLoading && <p className="px-3 py-2 text-sm text-fg-subtle">กำลังค้นหา…</p>}
              {!isLoading && results?.length === 0 && <p className="px-3 py-2 text-sm text-fg-subtle">ไม่พบสินทรัพย์</p>}
              {results?.map((instrument) => (
                <button
                  key={instrument.symbol}
                  type="button"
                  onClick={() => {
                    setSymbol(instrument.symbol);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <span className="font-mono text-fg">{instrument.symbol}</span>
                  <span className="truncate text-xs text-fg-subtle">{instrument.nameTh}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-fg-subtle">จำนวนหน่วย</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="เช่น 10"
            className="h-10 rounded-md border border-border bg-surface-2 px-3 font-mono text-sm tabular-nums text-fg placeholder:text-fg-subtle outline-none focus-visible:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-fg-subtle">ต้นทุนต่อหน่วย</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            placeholder="เช่น 220.50"
            className="h-10 rounded-md border border-border bg-surface-2 px-3 font-mono text-sm tabular-nums text-fg placeholder:text-fg-subtle outline-none focus-visible:border-accent"
          />
        </label>
      </div>

      <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "กำลังบันทึก…" : "เพิ่มเข้าพอร์ต"}
      </Button>
    </form>
  );
}
