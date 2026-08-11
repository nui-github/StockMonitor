import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { AlertsView } from "./AlertsView";

export const metadata: Metadata = { title: "แจ้งเตือน" };

export default async function AlertsPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <AlertsView session={session} />
    </AppShell>
  );
}
