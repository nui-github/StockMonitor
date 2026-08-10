import type { Quote } from "@/types/market";

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}

export function StatGrid({ quote }: { quote: Quote }) {
  const stats = [
    { label: "เปิด", value: formatNumber(quote.open) },
    { label: "สูงสุด", value: formatNumber(quote.high) },
    { label: "ต่ำสุด", value: formatNumber(quote.low) },
    { label: "ปิดก่อนหน้า", value: formatNumber(quote.prevClose) },
    { label: "ปริมาณ", value: formatVolume(quote.volume) },
    { label: "สกุลเงิน", value: quote.currency },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-surface-1 p-4 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="text-xs text-fg-subtle">{s.label}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
