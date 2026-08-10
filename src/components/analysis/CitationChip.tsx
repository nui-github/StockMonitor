"use client";

import type { NewsItem } from "@/lib/services/news";

export function CitationChip({ sourceIds, newsById }: { sourceIds: string[]; newsById: Map<string, NewsItem> }) {
  if (sourceIds.length === 0) return null;

  return (
    <span className="ml-1 inline-flex items-center gap-0.5 align-middle">
      {sourceIds.map((id) => {
        const article = newsById.get(id);
        if (!article) return null;
        return (
          <a
            key={id}
            href={article.url}
            target="_blank"
            rel="noopener nofollow"
            title={`${article.source.name}: ${article.title}`}
            className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-3 px-1 font-mono text-[10px] text-accent transition-colors hover:bg-accent/20"
          >
            {article.source.name.slice(0, 1)}
          </a>
        );
      })}
    </span>
  );
}
