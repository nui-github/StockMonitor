import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { CompareView } from "./CompareView";

export const metadata: Metadata = { title: "เปรียบเทียบสินทรัพย์" };

export default async function ComparePage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <CompareView />
    </AppShell>
  );
}
