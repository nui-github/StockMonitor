"use client";

import { cn } from "@/lib/utils/cn";

export interface IndicatorOption {
  key: string;
  label: string;
}

export const INDICATOR_OPTIONS: IndicatorOption[] = [
  { key: "sma20", label: "SMA 20" },
  { key: "sma50", label: "SMA 50" },
  { key: "ema12", label: "EMA 12" },
  { key: "rsi14", label: "RSI 14" },
  { key: "macd", label: "MACD" },
  { key: "bb20", label: "Bollinger 20" },
];

export function IndicatorPanel({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {INDICATOR_OPTIONS.map((opt) => {
        const active = selected.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onToggle(opt.key)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-fg-muted hover:border-border hover:bg-surface-2",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
