import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SymbolView } from "./SymbolView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return { title: symbol.toUpperCase() };
}

export default async function SymbolPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  return (
    <AppShell>
      <SymbolView symbol={symbol} />
    </AppShell>
  );
}
