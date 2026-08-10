import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { WatchlistView } from "./WatchlistView";

export const metadata: Metadata = { title: "ติดตาม" };

export default async function WatchlistPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <WatchlistView session={session} />
    </AppShell>
  );
}
