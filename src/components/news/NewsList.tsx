"use client";

import { Newspaper } from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { NewsItem } from "./NewsItem";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export function NewsList({ symbol }: { symbol: string }) {
  const { data, isLoading, error, refetch } = useNews(symbol);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="ดึงข่าวไม่สำเร็จ"
        code={error instanceof Error ? error.message : "PROVIDER_UNAVAILABLE"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={Newspaper} title="ยังไม่มีข่าวสำหรับสินทรัพย์นี้" description="ระบบดึงข่าวใหม่ทุก 15 นาที" />;
  }

  return (
    <div className="flex flex-col divide-y divide-border-soft">
      {data.map((item) => (
        <NewsItem key={item.id} item={item} />
      ))}
    </div>
  );
}
