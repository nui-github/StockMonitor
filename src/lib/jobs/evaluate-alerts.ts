import { checkAlertCondition, listActiveAlerts, markAlertFired } from "@/lib/services/alerts";
import { listSubscriptionsForUser, removeSubscriptionByEndpoint } from "@/lib/services/push-subscriptions";
import { sendPushNotification } from "@/lib/notifications/push";
import { getQuotes } from "@/lib/services/quotes";
import { isPushConfigured } from "@/lib/config/env";

export interface EvaluateAlertsStats {
  checked: number;
  triggered: number;
  pushSent: number;
  pushFailed: number;
}

// เช็ค alert ที่ active ทุกตัวกับราคาปัจจุบัน → ยิง push ตัวที่ตรงเงื่อนไข แล้วปิด alert นั้น (ยิงครั้งเดียวต่อรายการ)
// ไม่แตะ AI เลย ปลอดภัยให้รันอัตโนมัติ (docs/01 §evaluate-alerts)
export async function evaluateAlerts(): Promise<EvaluateAlertsStats> {
  const stats: EvaluateAlertsStats = { checked: 0, triggered: 0, pushSent: 0, pushFailed: 0 };

  const alertsRes = await listActiveAlerts();
  if (!alertsRes.ok || alertsRes.value.length === 0) return stats;

  const alerts = alertsRes.value;
  stats.checked = alerts.length;

  const symbols = [...new Set(alerts.map((a) => a.symbol))];
  const { quotes } = await getQuotes(symbols);
  const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));

  for (const alert of alerts) {
    const quote = quoteBySymbol.get(alert.symbol);
    if (!quote) continue;
    if (!checkAlertCondition(alert, quote)) continue;

    stats.triggered++;
    await markAlertFired(alert.id);

    if (!isPushConfigured()) continue;

    const subsRes = await listSubscriptionsForUser(alert.userId);
    if (!subsRes.ok) continue;

    const payload = {
      title: `${alert.symbol} ${alertLabel(alert.type)}`,
      body: `ราคาปัจจุบัน ${quote.price.toLocaleString()} ${quote.currency}`,
      url: `/s/${alert.symbol}`,
    };

    for (const sub of subsRes.value) {
      const sendRes = await sendPushNotification(sub, payload);
      if (sendRes.ok) {
        stats.pushSent++;
      } else {
        stats.pushFailed++;
        if (sendRes.error.code === "SUBSCRIPTION_EXPIRED") await removeSubscriptionByEndpoint(sub.endpoint);
      }
    }
  }

  return stats;
}

function alertLabel(type: "price_above" | "price_below" | "pct_change"): string {
  if (type === "price_above") return "ขึ้นถึงราคาที่ตั้งไว้";
  if (type === "price_below") return "ลงถึงราคาที่ตั้งไว้";
  return "เปลี่ยนแปลงตามเปอร์เซ็นต์ที่ตั้งไว้";
}
