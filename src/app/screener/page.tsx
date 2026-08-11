import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ScreenerView } from "./ScreenerView";

export const metadata: Metadata = { title: "กรองสินทรัพย์" };

export default async function ScreenerPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <ScreenerView />
    </AppShell>
  );
}
