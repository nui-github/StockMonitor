import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { getInstrument } from "@/lib/services/instruments";
import { SymbolView } from "./SymbolView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const instrument = await getInstrument(symbol);
  const label = instrument?.nameTh ?? instrument?.name ?? upper;
  const description = `ราคาเรียลไทม์ กราฟ และบทวิเคราะห์ AI ภาษาไทยของ ${label} (${upper})`;

  return {
    title: `${upper} · ${label}`,
    description,
    openGraph: { title: `${upper} · ${label}`, description },
    twitter: { card: "summary_large_image", title: `${upper} · ${label}`, description },
  };
}

export default async function SymbolPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const session = await auth();

  return (
    <AppShell session={session}>
      <SymbolView symbol={symbol} session={session} />
    </AppShell>
  );
}
