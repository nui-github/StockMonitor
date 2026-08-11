import Link from "next/link";
import { LayoutDashboard, LineChart, Star, GitCompare, Bell, Sparkles, Info } from "lucide-react";

const navItems = [
  { href: "/", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/markets", label: "ตลาด", icon: LineChart },
  { href: "/watchlist", label: "ติดตาม", icon: Star },
  { href: "/compare", label: "เปรียบเทียบ", icon: GitCompare },
  { href: "/alerts", label: "แจ้งเตือน", icon: Bell },
  { href: "/account/usage", label: "การใช้งาน AI", icon: Sparkles },
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border-soft bg-surface-1 lg:flex">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2 border-t border-border-soft p-3 text-xs text-fg-subtle">
        <Info size={14} aria-hidden="true" />
        <span>ข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน</span>
      </div>
    </aside>
  );
}
