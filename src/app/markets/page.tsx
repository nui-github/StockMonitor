import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { MarketsView } from "./MarketsView";

export const metadata: Metadata = { title: "ตลาด" };

export default async function MarketsPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <MarketsView />
    </AppShell>
  );
}
