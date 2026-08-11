"use client";

import { useEffect } from "react";

// mount ที่ root layout — แยกจาก usePushSubscription เพราะ SW ต้อง register ทันทีที่เข้าเว็บ
// (ให้ browser พิจารณา installable + cache app shell ได้) ไม่ใช่รอจนผู้ใช้กดสมัคร push
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
