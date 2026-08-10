import { Badge } from "@/components/ui/Badge";

const TIER_TONE = {
  1: "accent",
  2: "neutral",
  3: "neutral",
  4: "warn",
} as const;

export function SourceBadge({ name, tier }: { name: string; tier: number }) {
  const tone = TIER_TONE[tier as 1 | 2 | 3 | 4] ?? "neutral";
  return <Badge tone={tone}>{name}</Badge>;
}
