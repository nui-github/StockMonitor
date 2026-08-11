"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useSearch } from "@/hooks/useSearch";

export function AddSymbolDialog({
  open,
  onClose,
  onAdd,
  selectedSymbols,
  title = "เพิ่มสินทรัพย์ที่ติดตาม",
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (symbol: string) => void;
  selectedSymbols: string[];
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useSearch(query, query.length > 0);

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาหุ้น, ETF, ทองคำ…"
          aria-label="ค้นหาสินทรัพย์"
          className="h-10 w-full rounded-md border border-border bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle outline-none focus-visible:border-accent"
        />
      </div>

      <div className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
        {isLoading && <p className="py-4 text-center text-sm text-fg-subtle">กำลังค้นหา…</p>}

        {!isLoading && query.length > 0 && results?.length === 0 && (
          <p className="py-4 text-center text-sm text-fg-subtle">ไม่พบสินทรัพย์ที่ตรงกับ &quot;{query}&quot;</p>
        )}

        {results?.map((instrument) => {
          const already = selectedSymbols.includes(instrument.symbol);
          return (
            <div
              key={instrument.symbol}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-surface-2"
            >
              <div className="min-w-0">
                <div className="font-mono text-sm text-fg">{instrument.symbol}</div>
                <div className="truncate text-xs text-fg-subtle">{instrument.nameTh}</div>
              </div>
              <Button
                size="sm"
                variant={already ? "ghost" : "outline"}
                disabled={already}
                onClick={() => onAdd(instrument.symbol)}
              >
                <Plus size={14} aria-hidden="true" />
                {already ? "เพิ่มแล้ว" : "เพิ่ม"}
              </Button>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
