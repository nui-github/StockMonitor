import type { Metadata } from "next";
import { Noto_Sans_Thai, Noto_Sans, Noto_Sans_Mono } from "next/font/google";
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

const notoMono = Noto_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
