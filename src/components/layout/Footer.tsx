import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

const legalLinks = [
  { href: "/disclaimer", label: "ข้อจำกัดความรับผิดชอบ" },
  { href: "/privacy", label: "ความเป็นส่วนตัว" },
  { href: "/terms", label: "ข้อกำหนดการใช้งาน" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-soft px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 text-xs text-fg-subtle sm:flex-row">
        <p>
          © {new Date().getFullYear()} {siteConfig.name} — ข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน
        </p>
        <nav className="flex items-center gap-4">
          {legalLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-fg-muted hover:underline">
              {l.label}
            </Link>
          ))}
          <a href="mailto:nuifolio@gmail.com" className="hover:text-fg-muted hover:underline">
            ติดต่อ
          </a>
        </nav>
      </div>
    </footer>
  );
}
