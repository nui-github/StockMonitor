"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSearch } from "@/hooks/useSearch";
import { cn } from "@/lib/utils/cn";
import type { AlertType } from "@/lib/services/alerts";

const TYPE_OPTIONS: { key: AlertType; label: string; unit: string; placeholder: string }[] = [
  { key: "price_above", label: "ราคาขึ้นถึง", unit: "", placeholder: "เช่น 250" },
  { key: "price_below", label: "ราคาลงถึง", unit: "", placeholder: "เช่น 200" },
  { key: "pct_change", label: "เปลี่ยนแปลงเกิน", unit: "%", placeholder: "เช่น 5" },
];

export function AlertForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (input: { symbol: string; type: AlertType; value: number }) => void;
  isSubmitting: boolean;
}) {
  const [query, setQuery] = useState("");
  const [symbol, setSymbol] = useState<string | null>(null);
  const [type, setType] = useState<AlertType>("price_above");
  const [value, setValue] = useState("");

  const { data: results, isLoading } = useSearch(query, query.length > 0 && !symbol);

  const numericValue = Number(value);
  const canSubmit = Boolean(symbol) && value.trim().length > 0 && Number.isFinite(numericValue) && numericValue > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !canSubmit) return;
    onSubmit({ symbol, type, value: numericValue });
    setSymbol(null);
    setQuery("");
    setValue("");
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
            aria-label="ค้นหาสินทรัพย์เพื่อตั้งเตือน"
            className="h-10 w-full rounded-md border border-border bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:border-accent"
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

      <div className="flex flex-wrap gap-1.5">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setType(opt.key)}
            aria-pressed={type === opt.key}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              type === opt.key ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-fg-muted hover:bg-surface-2",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={TYPE_OPTIONS.find((o) => o.key === type)?.placeholder}
          aria-label="ค่าเงื่อนไขการแจ้งเตือน"
          className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 font-mono text-sm tabular-nums text-fg placeholder:text-fg-subtle focus-visible:border-accent"
        />
        {TYPE_OPTIONS.find((o) => o.key === type)?.unit && (
          <span className="text-sm text-fg-subtle">{TYPE_OPTIONS.find((o) => o.key === type)?.unit}</span>
        )}
      </div>

      <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "กำลังบันทึก…" : "ตั้งเตือน"}
      </Button>
    </form>
  );
}
