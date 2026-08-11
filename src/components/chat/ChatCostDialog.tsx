"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useChatEstimate } from "@/hooks/useChat";
import { cn } from "@/lib/utils/cn";

type ModelKey = "standard" | "deep";

const MODEL_OPTIONS: { key: ModelKey; label: string; desc: string }[] = [
  { key: "standard", label: "มาตรฐาน", desc: "เร็ว ประหยัด — เหมาะกับคำถามทั่วไป" },
  { key: "deep", label: "เชิงลึก", desc: "ละเอียดกว่า ใช้เวลานานกว่า — ต้นทุนสูงกว่า ~5 เท่า" },
];

function formatThb(value: number): string {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ยืนยันต้นทุนครั้งเดียวตอนเริ่มแชท (ไม่ใช่ทุกข้อความ) — client เก็บค่าที่ยืนยันไว้แล้วแนบไปกับทุกข้อความถัดไป
// เองโดยไม่ถามซ้ำ ฝั่ง server ยังคง require confirmedCostThb ทุกครั้งตามข้อ 9 เป๊ะ ๆ (ดู ChatPanel.tsx)
export function ChatCostDialog({
  open,
  onClose,
  symbol,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  symbol: string;
  onConfirm: (model: ModelKey, costThb: number) => void;
}) {
  const [model, setModel] = useState<ModelKey>("standard");
  const estimate = useChatEstimate();

  useEffect(() => {
    if (open) estimate.mutate({ symbol, model });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, symbol, model]);

  return (
    <Dialog open={open} onClose={onClose} title={`เริ่มแชทกับ AI เกี่ยวกับ ${symbol.toUpperCase()}`}>
      <p className="text-sm text-fg-muted">
        ถามได้ตามธรรมชาติ — AI จะตอบจากราคา ข้อมูลเทคนิค และข่าวล่าสุดของสินทรัพย์นี้เท่านั้น
        ยืนยันครั้งนี้ครั้งเดียว ข้อความถัดไปในช่วงนี้ไม่ต้องยืนยันซ้ำ (แต่ยังนับต้นทุนจริงทุกข้อความ)
      </p>

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
          <span className="text-fg-subtle">ค่าใช้จ่ายโดยประมาณต่อข้อความ</span>
          {estimate.isPending ? (
            <span className="text-fg-subtle">กำลังคำนวณ…</span>
          ) : estimate.data ? (
            <span className="font-mono tabular-nums text-fg">ประมาณ {formatThb(estimate.data.estCostThb)} ฿</span>
          ) : estimate.isError ? (
            <span className="text-down">ประเมินไม่สำเร็จ</span>
          ) : null}
        </div>
        <p className="pt-1 text-xs text-fg-subtle">ตัวเลขข้างต้นเป็นการประมาณการต่อข้อความเดียว ค่าใช้จ่ายจริงต่อข้อความอาจต่างจากนี้เล็กน้อย</p>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button size="sm" disabled={!estimate.data} onClick={() => estimate.data && onConfirm(model, estimate.data.estCostThb)}>
          ยืนยันและเริ่มแชท
        </Button>
      </div>
    </Dialog>
  );
}
