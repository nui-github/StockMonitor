"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { GenerateReportButton } from "./GenerateReportButton";
import { CostWarningDialog } from "./CostWarningDialog";
import { GeneratingState } from "./GeneratingState";
import { AiReportCard } from "./AiReportCard";
import { useCachedAnalysis, useGenerateReport } from "@/hooks/useAnalysis";
import { useNews } from "@/hooks/useNews";
import { labelForModelId } from "@/lib/ai/model-labels";

export function AnalysisPanel({ symbol, session }: { symbol: string; session: Session | null }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isLoggedIn = Boolean(session?.user);

  const { data, isLoading, error, refetch } = useCachedAnalysis(symbol);
  const { data: news } = useNews(symbol);
  const generate = useGenerateReport(symbol);

  const handleConfirm = (model: "standard" | "deep", costThb: number) => {
    generate.mutate(
      { model, confirmedCostThb: costThb },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-accent" aria-hidden="true" />
          บทวิเคราะห์ AI
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && <Skeleton className="h-32 w-full" />}

        {!isLoading && error && (
          <ErrorState message="ดึงบทวิเคราะห์ไม่สำเร็จ" code={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
        )}

        {!isLoading && !error && data?.status === "none" && !generate.isPending && (
          <EmptyState
            title="ยังไม่มีบทวิเคราะห์"
            description={isLoggedIn ? "กดสร้างบทวิเคราะห์เพื่อดูมุมมอง AI จากข่าวและข้อมูลเทคนิค" : "เข้าสู่ระบบก่อนเพื่อสร้างบทวิเคราะห์"}
            action={
              <GenerateReportButton
                onClick={() => setDialogOpen(true)}
                disabled={!isLoggedIn}
                label={isLoggedIn ? "สร้างบทวิเคราะห์ด้วย AI" : "เข้าสู่ระบบเพื่อสร้างบทวิเคราะห์"}
              />
            }
          />
        )}

        {generate.isPending && <GeneratingState onCancel={() => generate.reset()} />}

        {!generate.isPending && generate.isError && (
          <ErrorState
            message="สร้างบทวิเคราะห์ไม่สำเร็จ"
            code={generate.error instanceof Error ? generate.error.message : undefined}
            onRetry={() => setDialogOpen(true)}
          />
        )}

        {!isLoading && !generate.isPending && data?.status === "ready" && data.report && data.meta && (
          <AiReportCard
            report={data.report}
            meta={data.meta}
            modelLabel={labelForModelId(data.meta.model)}
            news={news ?? []}
            onRegenerate={() => setDialogOpen(true)}
          />
        )}
      </CardContent>

      <CostWarningDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        symbol={symbol}
        onConfirm={handleConfirm}
        isGenerating={generate.isPending}
      />
    </Card>
  );
}
