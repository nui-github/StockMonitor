"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePushSubscription } from "@/hooks/usePushSubscription";

export function PushPermissionBanner() {
  const { state, isSubscribed, isLoading, subscribe, unsubscribe } = usePushSubscription();

  if (state === "unsupported") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border-soft bg-surface-2 px-3 py-2 text-xs text-fg-subtle">
        <BellOff size={14} aria-hidden="true" />
        เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนแบบ push
      </div>
    );
  }

  if (state === "not-configured") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border-soft bg-surface-2 px-3 py-2 text-xs text-fg-subtle">
        <BellOff size={14} aria-hidden="true" />
        ยังไม่เปิดใช้งานการแจ้งเตือนแบบ push
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-down/30 bg-down/5 px-3 py-2 text-xs text-fg-subtle">
        <BellOff size={14} className="text-down" aria-hidden="true" />
        คุณปิดการแจ้งเตือนไว้ — เปิดได้จากการตั้งค่าเบราว์เซอร์
      </div>
    );
  }

  if (state === "granted" && isSubscribed) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-up/30 bg-up/5 px-3 py-2 text-xs">
        <span className="flex items-center gap-2 text-fg-muted">
          <BellRing size={14} className="text-up" aria-hidden="true" />
          เปิดรับการแจ้งเตือนบนอุปกรณ์นี้แล้ว
        </span>
        <button type="button" onClick={() => void unsubscribe()} disabled={isLoading} className="text-fg-subtle hover:text-down">
          ปิด
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border-soft bg-surface-2 px-3 py-2 text-xs">
      <span className="flex items-center gap-2 text-fg-muted">
        <Bell size={14} aria-hidden="true" />
        เปิดการแจ้งเตือนเพื่อรับ push บนอุปกรณ์นี้เมื่อราคาตรงเงื่อนไข
      </span>
      <Button size="sm" variant="outline" onClick={() => void subscribe()} disabled={isLoading}>
        {isLoading ? "กำลังเปิด…" : "เปิดการแจ้งเตือน"}
      </Button>
    </div>
  );
}
