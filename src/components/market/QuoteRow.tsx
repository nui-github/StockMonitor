import Link from "next/link";
import { ChangePill } from "./ChangePill";

export interface QuoteRowData {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  currency: string;
}

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function QuoteRow({ symbol, name, price, changePct, currency }: QuoteRowData) {
  return (
    <Link
      href={`/s/${symbol}`}
      className="flex items-center justify-between gap-4 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-2"
    >
      <div className="min-w-0">
        <div className="font-mono text-sm font-medium text-fg">{symbol}</div>
        <div className="truncate text-xs text-fg-subtle">{name}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="font-mono text-sm tabular-nums text-fg">
          {formatPrice(price)} <span className="text-fg-subtle">{currency}</span>
        </div>
        <ChangePill changePct={changePct} />
      </div>
    </Link>
  );
}
