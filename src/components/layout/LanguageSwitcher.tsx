"use client";

import { useI18n } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "th", label: "TH" },
  { value: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center rounded-md border border-border p-0.5 text-xs">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          aria-pressed={locale === opt.value}
          className={cn(
            "rounded px-2 py-1 font-medium transition-colors",
            locale === opt.value ? "bg-accent text-bg" : "text-fg-subtle hover:text-fg",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
