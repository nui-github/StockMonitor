import { TrendingUp, TrendingDown } from "lucide-react";
import { CitationChip } from "./CitationChip";
import type { NewsItem } from "@/lib/services/news";

interface CasePoint {
  point: string;
  sourceIds: string[];
}

export function BullBearSplit({
  bullCase,
  bearCase,
  newsById,
}: {
  bullCase: CasePoint[];
  bearCase: CasePoint[];
  newsById: Map<string, NewsItem>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-up/20 bg-up/5 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-up">
          <TrendingUp size={13} aria-hidden="true" />
          มุมมองฝั่งบวก
        </div>
        <ul className="flex flex-col gap-1.5">
          {bullCase.map((b, i) => (
            <li key={i} className="text-xs leading-relaxed text-fg-muted">
              {b.point}
              <CitationChip sourceIds={b.sourceIds} newsById={newsById} />
            </li>
          ))}
          {bullCase.length === 0 && <li className="text-xs text-fg-subtle">ไม่มีข้อมูลเพียงพอ</li>}
        </ul>
      </div>

      <div className="rounded-md border border-down/20 bg-down/5 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-down">
          <TrendingDown size={13} aria-hidden="true" />
          มุมมองฝั่งลบ
        </div>
        <ul className="flex flex-col gap-1.5">
          {bearCase.map((b, i) => (
            <li key={i} className="text-xs leading-relaxed text-fg-muted">
              {b.point}
              <CitationChip sourceIds={b.sourceIds} newsById={newsById} />
            </li>
          ))}
          {bearCase.length === 0 && <li className="text-xs text-fg-subtle">ไม่มีข้อมูลเพียงพอ</li>}
        </ul>
      </div>
    </div>
  );
}
