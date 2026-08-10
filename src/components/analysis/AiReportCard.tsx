import { AlertTriangle, RefreshCw } from "lucide-react";
import type { Report } from "@/types/analysis";
import type { NewsItem } from "@/lib/services/news";
import { Badge } from "@/components/ui/Badge";
import { SentimentGauge } from "./SentimentGauge";
import { BullBearSplit } from "./BullBearSplit";
import { CitationChip } from "./CitationChip";
import { DisclaimerBar } from "./DisclaimerBar";
import { CostFootnote } from "./CostFootnote";

export interface AiReportCardMeta {
  generatedAt: number;
  model: string;
  sourceCount: number;
  costThb: number;
  isStale: boolean;
  verifyWarnings: string[];
}

const TREND_TH: Record<string, string> = { uptrend: "ขาขึ้น", downtrend: "ขาลง", sideways: "แกว่งตัว" };
const MOMENTUM_TH: Record<string, string> = { strong: "แข็งแกร่ง", moderate: "ปานกลาง", weak: "อ่อนแรง" };

export function AiReportCard({
  report,
  meta,
  modelLabel,
  news,
  onRegenerate,
}: {
  report: Report;
  meta: AiReportCardMeta;
  modelLabel: string;
  news: NewsItem[];
  onRegenerate: () => void;
}) {
  const newsById = new Map(news.map((n) => [n.id, n]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold leading-snug text-fg">{report.headline}</h3>
          <div className="mt-1.5">
            <SentimentGauge sentiment={report.sentiment} label={report.sentimentLabel} />
          </div>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <RefreshCw size={12} aria-hidden="true" />
          สร้างใหม่
        </button>
      </div>

      {meta.verifyWarnings.length > 0 && (
        <div className="flex items-start gap-1.5 rounded-md border border-warn/30 bg-warn/5 p-2 text-xs text-warn">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>ระบบตรวจสอบพบข้อความบางส่วนไม่ผ่านเกณฑ์และถูกตัดออกแล้วโดยอัตโนมัติ</span>
        </div>
      )}

      <p className="text-sm leading-relaxed text-fg-muted">{report.summaryTh}</p>

      <BullBearSplit bullCase={report.bullCase} bearCase={report.bearCase} newsById={newsById} />

      <div>
        <h4 className="mb-2 text-xs font-medium text-fg-muted">ปัจจัยขับเคลื่อนหลัก</h4>
        <ul className="flex flex-col gap-2">
          {report.keyDrivers.map((d, i) => (
            <li key={i} className="text-xs leading-relaxed">
              <span className="font-medium text-fg">{d.title}</span>{" "}
              <Badge tone={d.direction === "positive" ? "up" : d.direction === "negative" ? "down" : "neutral"}>
                {d.impact}
              </Badge>
              <CitationChip sourceIds={d.sourceIds} newsById={newsById} />
              <p className="mt-0.5 text-fg-subtle">{d.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-border-soft bg-surface-2 p-3">
        <h4 className="mb-2 text-xs font-medium text-fg-muted">มุมมองเทคนิค</h4>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="text-fg-subtle">
            แนวโน้ม: <span className="font-medium text-fg">{TREND_TH[report.technical.trend]}</span>
          </span>
          <span className="text-fg-subtle">
            โมเมนตัม: <span className="font-medium text-fg">{MOMENTUM_TH[report.technical.momentum]}</span>
          </span>
        </div>
        {(report.technical.supports.length > 0 || report.technical.resistances.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs tabular-nums">
            {report.technical.supports.length > 0 && (
              <span className="text-up">แนวรับ: {report.technical.supports.join(", ")}</span>
            )}
            {report.technical.resistances.length > 0 && (
              <span className="text-down">แนวต้าน: {report.technical.resistances.join(", ")}</span>
            )}
          </div>
        )}
        <ul className="mt-2 flex flex-col gap-1">
          {report.technical.signals.map((s, i) => (
            <li key={i} className="text-xs text-fg-subtle">
              <span className="font-mono text-fg-muted">{s.indicator}</span>: {s.reading} — {s.interpretation}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-fg-subtle">{report.technical.note}</p>
      </div>

      {report.risks.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-medium text-fg-muted">ความเสี่ยง</h4>
          <ul className="list-inside list-disc text-xs leading-relaxed text-fg-subtle">
            {report.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {report.watchNext.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-medium text-fg-muted">สิ่งที่ต้องติดตามต่อ</h4>
          <ul className="list-inside list-disc text-xs leading-relaxed text-fg-subtle">
            {report.watchNext.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-fg-subtle">ความมั่นใจของบทวิเคราะห์</span>
        <span className="font-mono tabular-nums text-fg-muted">{Math.round(report.confidence * 100)}%</span>
      </div>

      {report.dataGaps.length > 0 && (
        <div className="rounded-md bg-surface-2 p-2 text-xs text-fg-subtle">
          <span className="font-medium">ข้อมูลจำกัด: </span>
          {report.dataGaps.join(" · ")}
        </div>
      )}

      <DisclaimerBar />
      <CostFootnote costThb={meta.costThb} generatedAt={meta.generatedAt} modelLabel={modelLabel} />
    </div>
  );
}
