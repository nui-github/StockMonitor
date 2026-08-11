import webpush from "web-push";
import { env, isPushConfigured } from "@/lib/config/env";
import { err, ok, type Result } from "@/lib/utils/result";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export type PushSendError =
  | { code: "NOT_CONFIGURED"; message: string }
  | { code: "SUBSCRIPTION_EXPIRED"; message: string }
  | { code: "SEND_FAILED"; message: string };

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured || !isPushConfigured()) return;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
  vapidConfigured = true;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
): Promise<Result<void, PushSendError>> {
  if (!isPushConfigured()) {
    return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า VAPID key" });
  }
  ensureVapidConfigured();

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return ok(undefined);
  } catch (e) {
    const statusCode = e instanceof webpush.WebPushError ? e.statusCode : undefined;
    if (statusCode === 404 || statusCode === 410) {
      return err({ code: "SUBSCRIPTION_EXPIRED", message: "subscription หมดอายุหรือถูกยกเลิก" });
    }
    return err({ code: "SEND_FAILED", message: e instanceof Error ? e.message : "ส่ง push ไม่สำเร็จ" });
  }
}
