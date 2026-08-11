import type { Metadata } from "next";
import { Noto_Sans_Thai, Noto_Sans } from "next/font/google";
import localFont from "next/font/local";
import { siteConfig, getSiteUrl } from "@/lib/config/site";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-sans",
  display: "swap",
});

// self-host แทน next/font/google — Next 15.5.23 pin URL ของ Noto Sans Mono ไว้กับ hash ที่ Google
// เลิกให้บริการแล้ว (ตัว family นี้กลายเป็น variable font ไฟล์เดียวคุมทุกน้ำหนัก ไม่ใช่ static ต่อ weight
// เหมือนเดิม) ทำให้ build fail ด้วย 404 ทุกครั้ง — self-host ตัดปัญหาพึ่งพา network ตอน build ไปเลย
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
      lang="th"
      className={`${notoThai.variable} ${notoSans.variable} ${notoMono.variable} dark`}
    >
      <body className="bg-bg font-sans text-fg antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
