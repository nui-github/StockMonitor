"use client";

// global-error แทนที่ root layout ทั้งหมดตอน error เกิดที่ระดับ root — ต้องมี html/body เอง
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="th">
      <body className="bg-bg text-fg antialiased">
        <div className="flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
          <div>
            <h1 className="text-lg font-semibold">เกิดข้อผิดพลาดร้ายแรง</h1>
            <p className="mt-1 text-sm text-fg-subtle">กรุณารีเฟรชหน้านี้อีกครั้ง</p>
          </div>
          <button
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-bg hover:bg-accent/90"
          >
            ลองใหม่
          </button>
        </div>
      </body>
    </html>
  );
}
