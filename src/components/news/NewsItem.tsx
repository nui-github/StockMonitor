import { ExternalLink } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import type { NewsItem as NewsItemType } from "@/lib/services/news";

function formatRelativeTh(ts: number): string {
  const diffMin = Math.round((Date.now() - ts) / 60_000);
  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ชม.ที่แล้ว`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} วันที่แล้ว`;
}

export function NewsItem({ item }: { item: NewsItemType }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener nofollow"
      className="flex flex-col gap-1.5 rounded-md p-3 transition-colors hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-2">
        <SourceBadge name={item.source.name} tier={item.source.tier} />
        <span className="text-xs text-fg-subtle">{formatRelativeTh(item.publishedAt)}</span>
      </div>
      <p className="text-sm leading-snug text-fg">{item.titleTh ?? item.title}</p>
      {item.summaryTh && <p className="text-xs leading-snug text-fg-subtle">{item.summaryTh}</p>}
      <span className="flex items-center gap-1 text-xs text-accent">
        อ่านต้นฉบับ
        <ExternalLink size={11} aria-hidden="true" />
      </span>
    </a>
  );
}
