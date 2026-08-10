import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, ApiClientError } from "@/lib/api/client";
import type { Report } from "@/types/analysis";

export interface ReportMeta {
  generatedAt: number;
  expiresAt: number;
  model: string;
  sourceCount: number;
  costThb: number;
  isStale: boolean;
  verifyWarnings: string[];
}

export interface CachedAnalysis {
  status: "ready" | "none";
  report?: Report;
  meta?: ReportMeta;
  canGenerate: boolean;
  newsAvailable: number;
}

export interface EstimateResponse {
  model: string;
  modelLabel: string;
  inputTokens: number;
  estOutputTokens: number;
  estCostUsd: number;
  estCostThb: number;
  isEstimate: true;
  quota: { usedToday: number; dailyLimit: number; resetsAt: number };
  canGenerate: boolean;
}

export function useCachedAnalysis(symbol: string) {
  return useQuery({
    queryKey: ["analysis", symbol],
    queryFn: async () => (await apiGet<CachedAnalysis>(`/api/v1/analysis/${encodeURIComponent(symbol)}`)).data,
    enabled: Boolean(symbol),
  });
}

export function useEstimate() {
  return useMutation({
    mutationFn: async ({ symbol, model }: { symbol: string; model: "standard" | "deep" }) =>
      (await apiGet<EstimateResponse>(`/api/v1/analysis/${encodeURIComponent(symbol)}/estimate?model=${model}`)).data,
  });
}

export function useGenerateReport(symbol: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ model, confirmedCostThb }: { model: "standard" | "deep"; confirmedCostThb: number }) => {
      const res = await fetch(`/api/v1/analysis/${encodeURIComponent(symbol)}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horizon: "short", model, confirmedCostThb }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new ApiClientError(json.error?.code ?? "UNKNOWN_ERROR", json.error?.message ?? "เกิดข้อผิดพลาด", res.status, json.error?.retryable ?? false);
      }
      return json.data as { report: Report; meta: ReportMeta & { actualCostUsd: number } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis", symbol] });
    },
  });
}
