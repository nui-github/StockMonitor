"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Tabs, type TabOption } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useScreener } from "@/hooks/useScreener";
import { cn } from "@/lib/utils/cn";
import type { AssetClass } from "@/types/market";

const ASSET_CLASS_OPTIONS: TabOption<AssetClass | "all">[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "stock", label: "หุ้น" },
  { value: "etf", label: "ETF" },
  { value: "commodity", label: "Commodity" },
];

type RsiFilter = "all" | "overbought" | "oversold";
type SmaFilter = "all" | "above" | "below";
type SortKey = "symbol" | "price" | "changePct" | "rsi14";

const RSI_OPTIONS: TabOption<RsiFilter>[] = [
  { value: "all", label: "RSI ทั้งหมด" },
  { value: "overbought", label: "Overbought (≥70)" },
  { value: "oversold", label: "Oversold (≤30)" },
];

const SMA_OPTIONS: TabOption<SmaFilter>[] = [
  { value: "all", label: "SMA50 ทั้งหมด" },
  { value: "above", label: "เหนือ SMA50" },
  { value: "below", label: "ใต้ SMA50" },
];

function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function ScreenerView() {
  const [assetClass, setAssetClass] = useState<AssetClass | "all">("all");
  const [rsiFilter, setRsiFilter] = useState<RsiFilter>("all");
  const [smaFilter, setSmaFilter] = useState<SmaFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "symbol", dir: "asc" });

  const { data, isLoading, error, refetch } = useScreener();

  const rows = useMemo(() => {
    let result = data ?? [];
    if (assetClass !== "all") result = result.filter((r) => r.assetClass === assetClass);
    if (rsiFilter !== "all") result = result.filter((r) => r.rsiSignal === rsiFilter);
    if (smaFilter !== "all") result = result.filter((r) => r.smaTrend === smaFilter);

    const sorted = [...result].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [data, assetClass, rsiFilter, smaFilter, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sort.key !== column) return <ArrowUpDown size={12} className="text-fg-subtle" aria-hidden="true" />;
    return sort.dir === "asc" ? (
      <ArrowUp size={12} className="text-accent" aria-hidden="true" />
    ) : (
      <ArrowDown size={12} className="text-accent" aria-hidden="true" />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-fg">กรองสินทรัพย์</h1>
        <p className="mt-1 text-sm text-fg-subtle">กรองด้วยสัญญาณเทคนิค (RSI, แนวโน้มเทียบ SMA50)</p>
      </div>

      <Tabs options={ASSET_CLASS_OPTIONS} value={assetClass} onChange={setAssetClass} />

      <div className="flex flex-wrap gap-4">
        <Tabs options={RSI_OPTIONS} value={rsiFilter} onChange={setRsiFilter} />
        <Tabs options={SMA_OPTIONS} value={smaFilter} onChange={setSmaFilter} />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <ErrorState message="ดึงข้อมูลไม่สำเร็จ" code={error instanceof Error ? error.message : "PROVIDER_UNAVAILABLE"} onRetry={() => refetch()} />
      )}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState title="ไม่พบสินทรัพย์ตรงเงื่อนไข" description="ลองปรับตัวกรอง" />
      )}

      {!isLoading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs text-fg-subtle">
                <SortableHeader label="สินทรัพย์" column="symbol" sort={sort} onClick={toggleSort} icon={<SortIcon column="symbol" />} />
                <SortableHeader label="ราคา" column="price" sort={sort} onClick={toggleSort} align="right" icon={<SortIcon column="price" />} />
                <SortableHeader label="เปลี่ยนแปลง" column="changePct" sort={sort} onClick={toggleSort} align="right" icon={<SortIcon column="changePct" />} />
                <SortableHeader label="RSI 14" column="rsi14" sort={sort} onClick={toggleSort} align="right" icon={<SortIcon column="rsi14" />} />
                <th className="px-3 py-2 text-right font-normal">แนวโน้ม SMA50</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.symbol} className="border-b border-border-soft last:border-0 hover:bg-surface-2">
                  <td className="px-3 py-2.5">
                    <Link href={`/s/${row.symbol}`} className="font-mono text-fg hover:text-accent">
                      {row.symbol}
                    </Link>
                    <div className="text-xs text-fg-subtle">{row.nameTh ?? row.name}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-fg">
                    {row.price !== null ? formatNumber(row.price) : "—"}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right font-mono tabular-nums",
                      row.changePct === null ? "text-fg-subtle" : row.changePct >= 0 ? "text-up" : "text-down",
                    )}
                  >
                    {row.changePct !== null ? `${row.changePct >= 0 ? "+" : ""}${formatNumber(row.changePct)}%` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {row.rsi14 !== null ? (
                      <span
                        className={cn(
                          "font-mono tabular-nums",
                          row.rsiSignal === "overbought" && "text-down",
                          row.rsiSignal === "oversold" && "text-up",
                          row.rsiSignal === "neutral" && "text-fg-muted",
                        )}
                      >
                        {formatNumber(row.rsi14, 1)}
                      </span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {row.smaTrend ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          row.smaTrend === "above" ? "bg-up/10 text-up" : "bg-down/10 text-down",
                        )}
                      >
                        {row.smaTrend === "above" ? "เหนือ SMA50" : "ใต้ SMA50"}
                      </span>
                    ) : (
                      <span className="text-xs text-fg-subtle">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  column,
  sort,
  onClick,
  icon,
  align = "left",
}: {
  label: string;
  column: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onClick: (column: SortKey) => void;
  icon: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-3 py-2 font-normal", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onClick(column)}
        aria-pressed={sort.key === column}
        className={cn("inline-flex items-center gap-1 hover:text-fg", align === "right" && "flex-row-reverse")}
      >
        {label}
        {icon}
      </button>
    </th>
  );
}
