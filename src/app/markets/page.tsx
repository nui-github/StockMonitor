import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { MarketsView } from "./MarketsView";

export const metadata: Metadata = { title: "ตลาด" };

export default function MarketsPage() {
  return (
    <AppShell>
      <MarketsView />
    </AppShell>
  );
}
