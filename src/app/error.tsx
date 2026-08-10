"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // ยังไม่มี Sentry ต่อ ให้ log ไว้ก่อนอย่างน้อยเห็นใน Vercel logs
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={40} strokeWidth={1.5} className="text-down" aria-hidden="true" />
      <div>
        <h1 className="text-lg font-semibold text-fg">เกิดข้อผิดพลาดบางอย่าง</h1>
        <p className="mt-1 text-sm text-fg-subtle">ทีมงานได้รับแจ้งแล้ว กรุณาลองใหม่อีกครั้ง</p>
        {error.digest && <p className="mt-1 font-mono text-xs text-fg-subtle">รหัส: {error.digest}</p>}
      </div>
      <button
        onClick={reset}
        className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-bg transition-colors duration-150 hover:bg-accent/90"
      >
        ลองใหม่
      </button>
    </div>
  );
}
