"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppShell>
      <ErrorState message="เกิดข้อผิดพลาดในการโหลดหน้านี้" code={error.digest} onRetry={reset} />
    </AppShell>
  );
}
