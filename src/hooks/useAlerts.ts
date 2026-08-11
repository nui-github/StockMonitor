import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import type { Alert, AlertType } from "@/lib/services/alerts";

export function useAlerts(enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await apiGet<Alert[]>("/api/v1/alerts")).data,
    enabled,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["alerts"] });

  const create = useMutation({
    mutationFn: (input: { symbol: string; type: AlertType; value: number }) => apiPost("/api/v1/alerts", input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/alerts/${encodeURIComponent(id)}`),
    onSuccess: invalidate,
  });

  return { ...query, create, remove };
}
