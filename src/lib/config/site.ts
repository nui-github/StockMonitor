export const siteConfig = {
  name: "StockMonitor",
  nameTh: "สต็อกมอนิเตอร์",
  description: "ติดตามราคาหุ้น ETF และ Commodity แบบเรียลไทม์ พร้อมบทวิเคราะห์จาก AI",
  locale: "th-TH",
  timezone: "Asia/Bangkok",
} as const;

// NEXT_PUBLIC_SITE_URL ไม่ตั้งตอน dev ก็ยัง build sitemap/OG ได้ (fallback localhost)
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
