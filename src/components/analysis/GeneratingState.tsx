import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GeneratingState({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Loader2 size={28} className="animate-spin text-accent" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-fg">กำลังวิเคราะห์…</p>
        <p className="mt-1 text-xs text-fg-subtle">ใช้เวลาประมาณ 20–40 วินาที</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        ยกเลิก
      </Button>
    </div>
  );
}
