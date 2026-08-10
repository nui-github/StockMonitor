import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { UsageView } from "./UsageView";

export const metadata: Metadata = { title: "การใช้งาน AI" };

export default async function UsagePage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <UsageView session={session} />
    </AppShell>
  );
}
