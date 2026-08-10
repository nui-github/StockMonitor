import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

export interface UsageResponse {
  today: { reports: number; costThb: number };
  thisMonth: { reports: number; costThb: number };
  quota: { dailyLimit: number; resetsAt: number };
}

export function useUsage(enabled: boolean) {
  return useQuery({
    queryKey: ["usage"],
    queryFn: async () => (await apiGet<UsageResponse>("/api/v1/usage")).data,
    enabled,
  });
}
