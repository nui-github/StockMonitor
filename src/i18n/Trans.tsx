"use client";

import { useI18n } from "./provider";

// leaf ที่เล็กที่สุดเท่าที่จะทำได้ — ตั้งใจไม่ให้ Sidebar/Footer ทั้งก้อนต้องเป็น "use client"
// (เคยลองแปลงทั้งสองไฟล์เป็น client component ตรง ๆ แล้วเจอ useId() hydration mismatch ที่
// CommandPalette's Dialog เพราะมันไปเลื่อน client-reference boundary count ในต้นไม้ RSC —
// ยืนยันด้วยการ stash แล้ว diff จริง ไม่ใช่เดา ดู commit message ประกอบ)
export function Trans({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}
