import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { WatchlistView } from "./WatchlistView";

export const metadata: Metadata = { title: "ติดตาม" };

export default function WatchlistPage() {
  return (
    <AppShell>
      <WatchlistView />
    </AppShell>
  );
}
