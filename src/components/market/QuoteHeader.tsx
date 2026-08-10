import type { Instrument, Quote } from "@/types/market";
import { ChangePill } from "./ChangePill";
import { MarketStatusPill } from "./MarketStatusPill";
import { Badge } from "@/components/ui/Badge";

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function formatTimeTh(ts: number): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(ts));
}

export function QuoteHeader({
  instrument,
  quote,
  isStale,
  live,
}: {
  instrument: Instrument;
  quote: Quote;
  isStale?: boolean;
  live?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-2xl font-semibold text-fg">{instrument.symbol}</h1>
          <Badge tone="neutral">{instrument.exchange ?? instrument.assetClass.toUpperCase()}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-fg-subtle">{instrument.nameTh ?? instrument.name}</p>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tabular-nums text-fg">{formatPrice(quote.price)}</span>
          <span className="font-mono text-sm text-fg-subtle">{quote.currency}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm tabular-nums text-fg-muted">{formatChange(quote.change)}</span>
          <ChangePill changePct={quote.changePct} />
          <MarketStatusPill state={quote.marketState} />
          {live && (
            <span className="flex items-center gap-1 text-xs text-up" title="เชื่อมต่อราคาสดอยู่">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" aria-hidden="true" />
              สด
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-fg-subtle">
          อัปเดต {formatTimeTh(quote.ts)}
          {isStale && " · ข้อมูลล่าช้า"}
        </p>
      </div>
    </div>
  );
}
