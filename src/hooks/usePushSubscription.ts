"use client";

import { useCallback, useEffect, useState } from "react";
import { apiPost, apiDelete } from "@/lib/api/client";

// Next.js inline ตัวแปร NEXT_PUBLIC_ ตอน build — อ่านตรง ๆ ได้ฝั่ง client (ไม่ใช่ความลับ)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushSupportState = "unsupported" | "not-configured" | "default" | "granted" | "denied";

export function usePushSubscription() {
  const [state, setState] = useState<PushSupportState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setState("not-configured");
      return;
    }
    setState(Notification.permission as PushSupportState);

    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const existing = await registration?.pushManager.getSubscription();
    setIsSubscribed(Boolean(existing));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      setState(permission as PushSupportState);
      if (permission !== "granted") return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Uint8Array<ArrayBufferLike> vs BufferSource — TS lib.dom mismatch ที่รู้กันดี ไม่ใช่บั๊ก runtime จริง
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      await apiPost("/api/v1/push/subscribe", subscription.toJSON());
      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return;

      await apiDelete("/api/v1/push/subscribe", { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { state, isSubscribed, isLoading, subscribe, unsubscribe };
}
