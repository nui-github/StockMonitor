import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <SearchX size={40} strokeWidth={1.5} className="text-fg-subtle" aria-hidden="true" />
      <div>
        <h1 className="text-lg font-semibold text-fg">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="mt-1 text-sm text-fg-subtle">อาจถูกย้าย ลบ หรือใส่ที่อยู่ผิด</p>
      </div>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-bg transition-colors duration-150 hover:bg-accent/90"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
