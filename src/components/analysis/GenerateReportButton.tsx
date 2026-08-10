import { Sparkles } from "lucide-react";

export function GenerateReportButton({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-md border border-accent/40 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:pointer-events-none disabled:opacity-40"
    >
      <Sparkles size={15} aria-hidden="true" />
      {label ?? "สร้างบทวิเคราะห์ด้วย AI"}
    </button>
  );
}
