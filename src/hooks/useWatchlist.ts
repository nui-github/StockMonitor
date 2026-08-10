import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

async function apiMutate(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 204) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error?.message ?? "เกิดข้อผิดพลาด");
  }
}

export function useDbWatchlist(enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => (await apiGet<string[]>("/api/v1/watchlist")).data,
    enabled,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["watchlist"] });

  const add = useMutation({
    mutationFn: (symbol: string) => apiMutate("/api/v1/watchlist", "POST", { symbol }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (symbol: string) => apiMutate(`/api/v1/watchlist/${encodeURIComponent(symbol)}`, "DELETE"),
    onSuccess: invalidate,
  });

  return { ...query, add, remove };
}
