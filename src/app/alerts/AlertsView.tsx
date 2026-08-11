"use client";

import type { Session } from "next-auth";
import { Bell, X } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AlertForm } from "@/components/alerts/AlertForm";
import { PushPermissionBanner } from "@/components/alerts/PushPermissionBanner";
import { useAlerts } from "@/hooks/useAlerts";
import type { Alert, AlertType } from "@/lib/services/alerts";

const TYPE_LABEL: Record<AlertType, string> = {
  price_above: "ราคาขึ้นถึง",
  price_below: "ราคาลงถึง",
  pct_change: "เปลี่ยนแปลงเกิน",
};

function conditionText(alert: Alert): string {
  const unit = alert.type === "pct_change" ? "%" : "";
  return `${TYPE_LABEL[alert.type]} ${alert.value.toLocaleString()}${unit}`;
}

export function AlertsView({ session }: { session: Session | null }) {
  const isLoggedIn = Boolean(session?.user);
  const { data, isLoading, error, refetch, create, remove } = useAlerts(isLoggedIn);

  if (!isLoggedIn) {
    return <EmptyState icon={Bell} title="กรุณาเข้าสู่ระบบ" description="เข้าสู่ระบบเพื่อตั้งการแจ้งเตือนราคา" />;
  }

  const active = data?.filter((a) => a.isActive) ?? [];
  const fired = data?.filter((a) => !a.isActive) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-fg">แจ้งเตือน</h1>
        <p className="mt-1 text-sm text-fg-subtle">ตั้งเตือนเมื่อราคาถึงระดับที่กำหนด ระบบเช็คทุก 5 นาทีตอนตลาดเปิด</p>
      </div>

      <PushPermissionBanner />

      <AlertForm onSubmit={(input) => create.mutate(input)} isSubmitting={create.isPending} />
      {create.isError && (
        <p className="text-xs text-down">{create.error instanceof Error ? create.error.message : "ตั้งเตือนไม่สำเร็จ"}</p>
      )}

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <ErrorState message="ดึงรายการแจ้งเตือนไม่สำเร็จ" code={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState icon={Bell} title="ยังไม่มีการแจ้งเตือน" description="เพิ่มการแจ้งเตือนแรกด้านบน" />
      )}

      {active.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-1">
          <div className="border-b border-border-soft px-3 py-2 text-xs font-medium text-fg-subtle">กำลังติดตาม ({active.length})</div>
          {active.map((alert) => (
            <div key={alert.id} className="group flex items-center justify-between border-b border-border-soft px-3 py-2.5 last:border-0">
              <div>
                <span className="font-mono text-sm text-fg">{alert.symbol}</span>
                <span className="ml-2 text-xs text-fg-subtle">{conditionText(alert)}</span>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(alert.id)}
                aria-label={`ลบการแจ้งเตือน ${alert.symbol}`}
                className="rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:bg-surface-3 hover:text-down focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {fired.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-1">
          <div className="border-b border-border-soft px-3 py-2 text-xs font-medium text-fg-subtle">แจ้งเตือนแล้ว ({fired.length})</div>
          {fired.map((alert) => (
            <div key={alert.id} className="group flex items-center justify-between border-b border-border-soft px-3 py-2.5 last:border-0 opacity-60">
              <div>
                <span className="font-mono text-sm text-fg">{alert.symbol}</span>
                <span className="ml-2 text-xs text-fg-subtle">{conditionText(alert)}</span>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(alert.id)}
                aria-label={`ลบการแจ้งเตือน ${alert.symbol}`}
                className="rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:bg-surface-3 hover:text-down focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
