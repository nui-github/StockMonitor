import { LogIn, LogOut } from "lucide-react";
import type { Session } from "next-auth";
import { signInAction, signOutAction } from "@/app/actions/auth";
import { isAuthConfigured } from "@/lib/config/env";

export function AuthButton({ session }: { session: Session | null }) {
  if (session?.user) {
    return (
      <form action={signOutAction} className="flex items-center gap-2">
        <span className="hidden text-xs text-fg-muted sm:inline">{session.user.name ?? session.user.email}</span>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <LogOut size={14} aria-hidden="true" />
          ออกจากระบบ
        </button>
      </form>
    );
  }

  if (!isAuthConfigured()) {
    return (
      <span className="hidden text-xs text-fg-subtle sm:inline" title="ยังไม่ได้ตั้งค่า Google OAuth">
        ยังไม่เปิดใช้งานการเข้าสู่ระบบ
      </span>
    );
  }

  return (
    <form action={signInAction}>
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
      >
        <LogIn size={14} aria-hidden="true" />
        เข้าสู่ระบบด้วย Google
      </button>
    </form>
  );
}
