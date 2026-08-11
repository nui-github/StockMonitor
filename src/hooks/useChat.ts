import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, ApiClientError } from "@/lib/api/client";
import type { ChatMessage } from "@/lib/services/chat";

export interface ChatEstimateResponse {
  model: string;
  modelLabel: string;
  inputTokens: number;
  estOutputTokens: number;
  estCostUsd: number;
  estCostThb: number;
  isEstimate: true;
}

export function useChatHistory(symbol: string, enabled: boolean) {
  return useQuery({
    queryKey: ["chat", symbol],
    queryFn: async () => (await apiGet<ChatMessage[]>(`/api/v1/chat/${encodeURIComponent(symbol)}`)).data,
    enabled: enabled && Boolean(symbol),
  });
}

export function useChatEstimate() {
  return useMutation({
    mutationFn: async ({ symbol, model }: { symbol: string; model: "standard" | "deep" }) =>
      (await apiGet<ChatEstimateResponse>(`/api/v1/chat/${encodeURIComponent(symbol)}/estimate?model=${model}`)).data,
  });
}

export function useSendChatMessage(symbol: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      message,
      model,
      confirmedCostThb,
    }: {
      message: string;
      model: "standard" | "deep";
      confirmedCostThb: number;
    }) => {
      const res = await fetch(`/api/v1/chat/${encodeURIComponent(symbol)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, model, confirmedCostThb }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new ApiClientError(json.error?.code ?? "UNKNOWN_ERROR", json.error?.message ?? "เกิดข้อผิดพลาด", res.status, json.error?.retryable ?? false);
      }
      return json.data as ChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", symbol] });
    },
  });
}
