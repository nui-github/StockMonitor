import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import type { Holding } from "@/lib/services/portfolio";

export function usePortfolio(enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => (await apiGet<Holding[]>("/api/v1/portfolio")).data,
    enabled,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["portfolio"] });

  const add = useMutation({
    mutationFn: (input: { symbol: string; quantity: number; costBasis: number }) => apiPost("/api/v1/portfolio", input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/portfolio/${encodeURIComponent(id)}`),
    onSuccess: invalidate,
  });

  return { ...query, add, remove };
}
