import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardView } from "./DashboardView";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <DashboardView />
    </AppShell>
  );
}
