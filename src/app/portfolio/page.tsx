import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { PortfolioView } from "./PortfolioView";

export const metadata: Metadata = { title: "พอร์ตการลงทุน" };

export default async function PortfolioPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <PortfolioView session={session} />
    </AppShell>
  );
}
