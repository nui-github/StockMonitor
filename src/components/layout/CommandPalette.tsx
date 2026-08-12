"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { useSearch } from "@/hooks/useSearch";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const { data: results, isLoading } = useSearch(query, query.length > 0);

  useEffect(() => {
    if (!open) setQuery("");
    setActiveIndex(0);
  }, [open, query]);

  const go = (symbol: string) => {
    router.push(`/s/${symbol}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) go(target.symbol);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="ค้นหา">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="พิมพ์ชื่อหุ้น, ETF, ทองคำ…"
          aria-label="ค้นหาสินทรัพย์"
          className="h-10 w-full rounded-md border border-border bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:border-accent"
        />
      </div>

      <div className="mt-3 flex max-h-72 flex-col gap-0.5 overflow-y-auto">
        {isLoading && <p className="py-4 text-center text-sm text-fg-subtle">กำลังค้นหา…</p>}

        {!isLoading && query.length > 0 && results?.length === 0 && (
          <p className="py-4 text-center text-sm text-fg-subtle">ไม่พบสินทรัพย์ที่ตรงกับ &quot;{query}&quot;</p>
        )}

        {results?.map((instrument, i) => (
          <button
            key={instrument.symbol}
            type="button"
            onClick={() => go(instrument.symbol)}
            onMouseEnter={() => setActiveIndex(i)}
            className={`flex items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors ${
              i === activeIndex ? "bg-surface-3" : "hover:bg-surface-2"
            }`}
          >
            <div className="min-w-0">
              <span className="font-mono text-sm text-fg">{instrument.symbol}</span>
              <span className="ml-2 truncate text-xs text-fg-subtle">{instrument.nameTh}</span>
            </div>
            <span className="shrink-0 text-xs uppercase text-fg-subtle">{instrument.assetClass}</span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
