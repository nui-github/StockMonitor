"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DISMISSED_KEY = "pwa-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 วัน ไม่รบกวนซ้ำถ้าเพิ่งปิดไป

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function wasRecentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      if (wasRecentlyDismissed()) return;
      setDeferredEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredEvent) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-3 shadow-lg sm:inset-x-auto sm:right-4 sm:w-80">
      <Download size={20} className="shrink-0 text-accent" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">ติดตั้ง StockMonitor</p>
        <p className="text-xs text-fg-subtle">เข้าเร็วขึ้น ใช้งานได้แม้ไม่มีเน็ต</p>
      </div>
      <Button size="sm" onClick={() => void install()}>
        ติดตั้ง
      </Button>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg"
        aria-label="ปิด"
      >
        <X size={16} />
      </button>
    </div>
  );
}
