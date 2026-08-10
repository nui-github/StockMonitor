"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useEstimate } from "@/hooks/useAnalysis";
import { cn } from "@/lib/utils/cn";

type ModelKey = "standard" | "deep";

const MODEL_OPTIONS: { key: ModelKey; label: string; desc: string }[] = [
  { key: "standard", label: "มาตรฐาน", desc: "เร็ว ประหยัด — เหมาะกับการดูภาพรวม" },
  { key: "deep", label: "เชิงลึก", desc: "ละเอียดกว่า ใช้เวลานานกว่า — ต้นทุนสูงกว่า ~5 เท่า" },
];

function formatThb(value: number): string {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CostWarningDialog({
  open,
  onClose,
  symbol,
  onConfirm,
  isGenerating,
}: {
  open: boolean;
  onClose: () => void;
  symbol: string;
  onConfirm: (model: ModelKey, costThb: number) => void;
  isGenerating: boolean;
}) {
  const [model, setModel] = useState<ModelKey>("standard");
  const estimate = useEstimate();

  useEffect(() => {
    if (open) estimate.mutate({ symbol, model });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, symbol, model]);

  return (
    <Dialog open={open} onClose={onClose} title={`สร้างบทวิเคราะห์ AI สำหรับ ${symbol.toUpperCase()}`}>
      <p className="text-sm text-fg-muted">ระบบจะอ่านข่าวล่าสุด + ข้อมูลเทคนิค แล้วสร้างบทสรุปภาษาไทย</p>

      <div className="mt-3 flex flex-col gap-2">
        {MODEL_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setModel(opt.key)}
            className={cn(
              "rounded-md border p-2.5 text-left transition-colors",
              model === opt.key ? "border-accent/50 bg-accent/5" : "border-border hover:bg-surface-2",
            )}
          >
            <div className="text-sm font-medium text-fg">{opt.label}</div>
            <div className="text-xs text-fg-subtle">{opt.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-1.5 rounded-md bg-surface-2 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-fg-subtle">ค่าใช้จ่าย</span>
          {estimate.isPending ? (
            <span className="text-fg-subtle">กำลังคำนวณ…</span>
          ) : estimate.data ? (
            <span className="font-mono tabular-nums text-fg">ประมาณ {formatThb(estimate.data.estCostThb)} ฿</span>
          ) : estimate.isError ? (
            <span className="text-down">ประเมินไม่สำเร็จ</span>
          ) : null}
        </div>
        {estimate.data && (
          <div className="flex justify-between">
            <span className="text-fg-subtle">โควตา</span>
            <span className="font-mono tabular-nums text-fg">
              วันนี้ใช้ไป {estimate.data.quota.usedToday}/{estimate.data.quota.dailyLimit} ฉบับ
            </span>
          </div>
        )}
        <p className="pt-1 text-xs text-fg-subtle">ตัวเลขข้างต้นเป็นการประมาณการ ค่าใช้จ่ายจริงอาจต่างจากนี้เล็กน้อย</p>
      </div>

      <p className="mt-3 text-xs text-fg-subtle">บทวิเคราะห์ที่สร้างแล้วจะเก็บไว้ 6 ชั่วโมง เปิดดูซ้ำได้ไม่มีค่าใช้จ่าย</p>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
          ยกเลิก
        </Button>
        <Button
          size="sm"
          disabled={!estimate.data || isGenerating}
          onClick={() => estimate.data && onConfirm(model, estimate.data.estCostThb)}
        >
          ยืนยันและสร้าง
        </Button>
      </div>
    </Dialog>
  );
}
