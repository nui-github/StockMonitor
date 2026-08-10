import { Badge } from "@/components/ui/Badge";

export type MarketState = "open" | "pre" | "post" | "closed" | "holiday";

const labelTh: Record<MarketState, string> = {
  open: "ตลาดเปิด",
  pre: "ก่อนเปิดตลาด",
  post: "หลังปิดตลาด",
  closed: "ตลาดปิด",
  holiday: "วันหยุด",
};

export function MarketStatusPill({ state }: { state: MarketState }) {
  const tone = state === "open" ? "up" : state === "closed" || state === "holiday" ? "neutral" : "warn";
  return <Badge tone={tone}>{labelTh[state]}</Badge>;
}
