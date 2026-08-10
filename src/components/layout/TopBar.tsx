"use client";

import { Search, Sparkles } from "lucide-react";
import type { Session } from "next-auth";
import { siteConfig } from "@/lib/config/site";
import { AuthButton } from "./AuthButton";

export function TopBar({ onOpenSearch, session }: { onOpenSearch: () => void; session: Session | null }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-soft bg-surface-1/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2 font-semibold text-fg">
        <Sparkles size={18} className="text-accent" strokeWidth={1.75} aria-hidden="true" />
        <span>{siteConfig.name}</span>
      </div>
      <button
        type="button"
        onClick={onOpenSearch}
        className="relative ml-2 flex h-9 max-w-sm flex-1 items-center rounded-md border border-border bg-surface-2 pl-9 pr-3 text-left text-sm text-fg-subtle outline-none transition-colors hover:border-accent/40 focus-visible:border-accent"
      >
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        ค้นหาหุ้น, ETF, ทองคำ…
      </button>
      <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle sm:inline">
        ⌘K
      </kbd>
      <div className="ml-auto">
        <AuthButton session={session} />
      </div>
    </header>
  );
}
