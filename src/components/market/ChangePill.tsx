import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function ChangePill({ changePct, className }: { changePct: number; className?: string }) {
  const direction = changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const toneClass =
    direction === "up"
      ? "text-up bg-up/10 border-up/30"
      : direction === "down"
        ? "text-down bg-down/10 border-down/30"
        : "text-flat bg-surface-3 border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs tabular-nums",
        toneClass,
        className,
      )}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {formatPct(changePct)}
    </span>
  );
}
