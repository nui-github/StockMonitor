"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Session } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuoteHeader } from "@/components/market/QuoteHeader";
import { StatGrid } from "@/components/market/StatGrid";
import { PriceChart } from "@/components/chart/PriceChart";
import { ChartToolbar } from "@/components/chart/ChartToolbar";
import { IndicatorPanel } from "@/components/chart/IndicatorPanel";
import { NewsList } from "@/components/news/NewsList";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useQuote } from "@/hooks/useQuotes";
import { useQuoteStream } from "@/hooks/useQuoteStream";
import { useCandles } from "@/hooks/useCandles";
import { useSearch } from "@/hooks/useSearch";
import type { RangeKey } from "@/types/market";

// REST ใช้ดึงค่าตั้งต้น + สถานะ error/not-found; SSE overlay ราคาสดทับเมื่อเชื่อมต่อได้ (docs/01 §3 Path A)
const QUOTE_POLL_MS = 15_000;

export function SymbolView({ symbol, session }: { symbol: string; session: Session | null }) {
  const [range, setRange] = useState<RangeKey>("6mo");
  const [indicators, setIndicators] = useState<string[]>([]);

  // ยังไม่มี /api/v1/instruments/[symbol] แยก — ใช้ search ด้วย symbol ตรง ๆ เพื่อได้ metadata (docs/09 Phase 1)
  const { data: searchResults, isLoading: instrumentLoading } = useSearch(symbol);
  const instrument = searchResults?.find((i) => i.symbol === symbol.toUpperCase()) ?? null;

  const { quote: restQuote, isFailed, isLoading: quoteLoading, error: quoteError, refetch: refetchQuote } = useQuote(
    symbol,
    { refetchIntervalMs: QUOTE_POLL_MS },
  );
  const { quotes: liveQuotes, connected } = useQuoteStream(instrument ? [symbol.toUpperCase()] : []);
  const quote = liveQuotes[symbol.toUpperCase()] ?? restQuote;

  const {
    data: candleData,
    isLoading: candlesLoading,
    error: candlesError,
    refetch: refetchCandles,
  } = useCandles(symbol, "1d", range, indicators);

  const toggleIndicator = (key: string) => {
    setIndicators((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const candles = useMemo(() => candleData?.candles ?? [], [candleData]);

  if (instrumentLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!instrument) {
    return <EmptyState title={`ไม่พบสินทรัพย์ "${symbol}"`} description="ลองค้นหาด้วยชื่อหรือสัญลักษณ์อื่น" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {quoteLoading && !quote && <Skeleton className="h-24 w-full" />}

      {!quoteLoading && (isFailed || quoteError) && (
        <Card>
          <CardContent className="pt-5">
            <ErrorState
              message="ดึงราคาปัจจุบันไม่สำเร็จ"
              code={quoteError instanceof Error ? quoteError.message : "PROVIDER_UNAVAILABLE"}
              onRetry={() => refetchQuote()}
            />
          </CardContent>
        </Card>
      )}

      {quote && <QuoteHeader instrument={instrument} quote={quote} live={connected} />}
      {quote && <StatGrid quote={quote} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ChartToolbar range={range} onRangeChange={setRange} />
              <button
                type="button"
                onClick={() => refetchCandles()}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <RefreshCw size={13} aria-hidden="true" />
                รีเฟรช
              </button>
            </div>

            <IndicatorPanel selected={indicators} onToggle={toggleIndicator} />

            <div className="h-[420px]">
              {candlesLoading && !candleData && <Skeleton className="h-full w-full" />}

              {!candlesLoading && candlesError && (
                <ErrorState
                  message="ดึงข้อมูลกราฟไม่สำเร็จ"
                  code={candlesError instanceof Error ? candlesError.message : "PROVIDER_UNAVAILABLE"}
                  onRetry={() => refetchCandles()}
                />
              )}

              {!candlesError && candleData && candles.length === 0 && (
                <EmptyState title="ยังไม่มีข้อมูลกราฟในช่วงเวลานี้" description="ลองเลือกช่วงเวลาอื่น" />
              )}

              {!candlesError && candles.length > 0 && <PriceChart candles={candles} />}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <AnalysisPanel symbol={symbol} session={session} />

          <ChatPanel symbol={symbol} session={session} />

          <Card>
            <CardHeader>
              <CardTitle>ข่าวล่าสุด</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <NewsList symbol={symbol} />
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-center text-xs text-fg-subtle">
        ข้อมูลและบทวิเคราะห์บนเว็บไซต์นี้จัดทำเพื่อการศึกษาเท่านั้น ไม่ถือเป็นคำแนะนำการลงทุน
      </p>
    </div>
  );
}
