import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteConfig, getSiteUrl } from "@/lib/config/site";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { I18nProvider } from "@/i18n/provider";
import { defaultLocale } from "@/i18n/config";
import "./globals.css";

// self-host ทั้ง 3 ตัว แทน next/font/google — Next 15.5.23 pin URL ไว้กับ hash ที่ Google เปลี่ยนไปแล้ว
// (ทุกตัวกลายเป็น variable font ไฟล์เดียวคุมทุกน้ำหนัก ไม่ใช่ static ต่อ weight เหมือนเดิม) ทำให้ build/dev
// fail ด้วย 404 เป็นระยะเมื่อ Google หมุน hash — เจอกับ Mono ก่อน (self-host ไปแล้ว) แล้วเจอกับ Sans ตามมา
// (บล็อกทั้งหน้าเพราะ layout.tsx ใช้ตรง ๆ) เลย self-host รวดเดียวทั้ง 3 ตัวกันปัญหาเดิมซ้ำกับ Thai ทีหลัง
// ไฟล์ Thai ดาวน์โหลดมาเฉพาะช่วง unicode Thai เท่านั้น (ไม่รวม latin) เพราะ font-sans ใน globals.css
// stack notoThai ต่อด้วย notoSans อยู่แล้ว — อักษร latin ที่ notoThai ไม่มี browser จะ fallback ไป notoSans เอง
const notoThai = localFont({
  src: "./fonts/NotoSansThai-Thai.woff2",
  weight: "400 700",
  variable: "--font-noto-thai",
  display: "swap",
});

const notoSans = localFont({
  src: "./fonts/NotoSans-Latin.woff2",
  weight: "400 600",
  variable: "--font-noto-sans",
  display: "swap",
});

const notoMono = localFont({
  src: "./fonts/NotoSansMono-Latin.woff2",
  weight: "400 600",
  variable: "--font-noto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={defaultLocale}
      className={`${notoThai.variable} ${notoSans.variable} ${notoMono.variable} dark`}
    >
      <body className="bg-bg font-sans text-fg antialiased">
        <QueryProvider>
          <I18nProvider>{children}</I18nProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
