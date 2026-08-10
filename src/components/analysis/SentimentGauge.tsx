const LABEL_TH: Record<string, string> = {
  very_bearish: "ลบมาก",
  bearish: "ลบ",
  neutral: "เป็นกลาง",
  bullish: "บวก",
  very_bullish: "บวกมาก",
};

export function SentimentGauge({ sentiment, label }: { sentiment: number; label: string }) {
  const pct = ((sentiment + 1) / 2) * 100; // -1..1 -> 0..100
  const tone = sentiment > 0.15 ? "bg-up" : sentiment < -0.15 ? "bg-down" : "bg-flat";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-fg-muted">{LABEL_TH[label] ?? label}</span>
    </div>
  );
}
