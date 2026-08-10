"use client";

import { cn } from "@/lib/utils/cn";
import type { RangeKey } from "@/types/market";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "5d", label: "5D" },
  { key: "1mo", label: "1M" },
  { key: "6mo", label: "6M" },
  { key: "ytd", label: "YTD" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

export function ChartToolbar({
  range,
  onRangeChange,
}: {
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1">
      {RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => onRangeChange(r.key)}
          className={cn(
            "rounded px-2.5 py-1 font-mono text-xs font-medium transition-colors",
            range === r.key ? "bg-accent text-bg" : "text-fg-muted hover:bg-surface-3 hover:text-fg",
          )}
          aria-pressed={range === r.key}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
