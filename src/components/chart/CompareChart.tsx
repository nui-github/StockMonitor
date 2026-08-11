"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import type { Candle } from "@/types/market";

// สีต่อสินทรัพย์ในกราฟเปรียบเทียบ — เรียงเป็นลำดับคงที่ตามตำแหน่งที่เพิ่ม ไม่ผูกกับ semantic ขึ้น/ลง
export const COMPARE_COLORS = ["#22D3EE", "#F59E0B", "#A78BFA", "#10E098", "#FB7185", "#38BDF8"];

const CHART_COLORS = {
  grid: "#131B24",
  border: "#1C2733",
  text: "#93A1B3",
  crosshair: "#5B6472",
};

export interface CompareSeries {
  symbol: string;
  color: string;
  candles: Candle[];
}

// normalize เทียบกับแท่งแรกของแต่ละสินทรัพย์เอง (% change) ไม่ใช่เทียบวันเดียวกันตายตัว —
// รองรับกรณีตลาดหยุดไม่ตรงกัน (เช่น commodity vs หุ้นสหรัฐ)
function toPercentSeries(candles: Candle[]) {
  const base = candles[0]?.c;
  if (!base) return [];
  return candles.map((c) => ({
    time: Math.floor(c.t / 1000) as UTCTimestamp,
    value: ((c.c - base) / base) * 100,
  }));
}

export function CompareChart({ series }: { series: CompareSeries[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: { background: { color: "transparent" }, textColor: CHART_COLORS.text, fontFamily: "var(--font-mono)" },
      grid: { vertLines: { color: CHART_COLORS.grid }, horzLines: { color: CHART_COLORS.grid } },
      rightPriceScale: { borderColor: CHART_COLORS.border },
      timeScale: { borderColor: CHART_COLORS.border, timeVisible: true },
      crosshair: {
        vertLine: { color: CHART_COLORS.crosshair, labelBackgroundColor: CHART_COLORS.crosshair },
        horzLine: { color: CHART_COLORS.crosshair, labelBackgroundColor: CHART_COLORS.crosshair },
      },
      width: container.clientWidth,
      height: container.clientHeight,
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = new Map();
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const nextSymbols = new Set(series.map((s) => s.symbol));

    for (const [symbol, line] of seriesRef.current) {
      if (!nextSymbols.has(symbol)) {
        chart.removeSeries(line);
        seriesRef.current.delete(symbol);
      }
    }

    for (const s of series) {
      let line = seriesRef.current.get(s.symbol);
      if (!line) {
        line = chart.addSeries(LineSeries, { color: s.color, lineWidth: 2, priceFormat: { type: "percent" } });
        seriesRef.current.set(s.symbol, line);
      } else {
        line.applyOptions({ color: s.color });
      }
      line.setData(toPercentSeries(s.candles));
    }

    chart.timeScale().fitContent();
  }, [series]);

  return <div ref={containerRef} className="h-full min-h-[360px] w-full" />;
}
