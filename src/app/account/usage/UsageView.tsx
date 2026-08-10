"use client";

import type { Session } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUsage } from "@/hooks/useUsage";

function formatThb(value: number): string {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTimeTh(ts: number): string {
  return new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(
    new Date(ts),
  );
}

export function UsageView({ session }: { session: Session | null }) {
  const isLoggedIn = Boolean(session?.user);
  const { data, isLoading, error, refetch } = useUsage(isLoggedIn);

  if (!isLoggedIn) {
    return <EmptyState title="กรุณาเข้าสู่ระบบ" description="เข้าสู่ระบบเพื่อดูประวัติการใช้งาน AI ของคุณ" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-fg">การใช้งาน AI</h1>
        <p className="mt-1 text-sm text-fg-subtle">สรุปจำนวนบทวิเคราะห์และค่าใช้จ่ายที่คุณสร้าง</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {!isLoading && error && (
        <ErrorState message="ดึงข้อมูลการใช้งานไม่สำเร็จ" code={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
      )}

      {!isLoading && !error && data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>วันนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl tabular-nums text-fg">
                {data.today.reports}
                <span className="ml-1 text-sm text-fg-subtle">/{data.quota.dailyLimit} ฉบับ</span>
              </p>
              <p className="mt-1 font-mono text-sm tabular-nums text-fg-subtle">≈ {formatThb(data.today.costThb)} ฿</p>
              <p className="mt-2 text-xs text-fg-subtle">โควตารีเซ็ตเวลา {formatTimeTh(data.quota.resetsAt)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>เดือนนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl tabular-nums text-fg">{data.thisMonth.reports} ฉบับ</p>
              <p className="mt-1 font-mono text-sm tabular-nums text-fg-subtle">≈ {formatThb(data.thisMonth.costThb)} ฿</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
