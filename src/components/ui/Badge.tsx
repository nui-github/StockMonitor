import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "neutral" | "up" | "down" | "accent" | "warn";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-fg-muted border-border",
  up: "bg-up/10 text-up border-up/30",
  down: "bg-down/10 text-down border-down/30",
  accent: "bg-accent/10 text-accent border-accent/30",
  warn: "bg-warn/10 text-warn border-warn/30",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium leading-none",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
