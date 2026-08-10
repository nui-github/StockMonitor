"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "next-auth";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";
import { CommandPalette } from "./CommandPalette";

export function AppShell({ children, session = null }: { children: ReactNode; session?: Session | null }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <TopBar onOpenSearch={() => setSearchOpen(true)} session={session} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">{children}</div>
          <Footer />
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
