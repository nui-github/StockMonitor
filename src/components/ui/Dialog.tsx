"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={[
        "w-full max-w-md rounded-lg border border-border bg-surface-1 p-0 text-fg shadow-[var(--shadow-card)]",
        "backdrop:bg-black/60",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="rounded p-1 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}
