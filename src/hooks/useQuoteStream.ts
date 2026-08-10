"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/types/market";

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

export interface QuoteStreamState {
  quotes: Record<string, Quote>;
  connected: boolean;
}

/** เชื่อม SSE /api/v1/stream/quotes — reconnect แบบ exponential backoff, batch อัปเดตด้วย requestAnimationFrame (docs/06 §11) */
export function useQuoteStream(symbols: string[]): QuoteStreamState {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [connected, setConnected] = useState(false);

  const pendingRef = useRef<Record<string, Quote>>({});
  const rafRef = useRef<number | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const symbolsKey = [...symbols].sort().join(",");

  useEffect(() => {
    if (!symbolsKey) return;

    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const flush = () => {
      if (Object.keys(pendingRef.current).length === 0) return;
      setQuotes((prev) => ({ ...prev, ...pendingRef.current }));
      pendingRef.current = {};
      rafRef.current = null;
    };

    const scheduleFlush = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(flush);
    };

    const connect = () => {
      if (cancelled) return;
      source = new EventSource(`/api/v1/stream/quotes?symbols=${encodeURIComponent(symbolsKey)}`);

      source.addEventListener("open", () => {
        setConnected(true);
        backoffRef.current = INITIAL_BACKOFF_MS;
      });

      source.addEventListener("quote", (e) => {
        const quote = JSON.parse((e as MessageEvent).data) as Quote;
        pendingRef.current[quote.symbol] = quote;
        scheduleFlush();
      });

      source.addEventListener("error", () => {
        setConnected(false);
        source?.close();
        if (cancelled) return;

        reconnectTimer = setTimeout(connect, backoffRef.current);
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      });
    };

    connect();

    return () => {
      cancelled = true;
      source?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [symbolsKey]);

  return { quotes, connected };
}
