import Link from "next/link";
import { LayoutDashboard, LineChart, Star, GitCompare, Filter, Bell, Briefcase, Sparkles, Info } from "lucide-react";
import { Trans } from "@/i18n/Trans";

const navItems = [
  { href: "/", key: "nav.overview", icon: LayoutDashboard },
  { href: "/markets", key: "nav.markets", icon: LineChart },
  { href: "/watchlist", key: "nav.watchlist", icon: Star },
  { href: "/compare", key: "nav.compare", icon: GitCompare },
  { href: "/screener", key: "nav.screener", icon: Filter },
  { href: "/portfolio", key: "nav.portfolio", icon: Briefcase },
  { href: "/alerts", key: "nav.alerts", icon: Bell },
  { href: "/account/usage", key: "nav.usage", icon: Sparkles },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border-soft bg-surface-1 lg:flex">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <Trans k={key} />
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2 border-t border-border-soft p-3 text-xs text-fg-subtle">
        <Info size={14} aria-hidden="true" />
        <span>
          <Trans k="footer.tagline" />
        </span>
      </div>
    </aside>
  );
}
