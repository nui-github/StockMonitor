import type { NextConfig } from "next";

// docs/08 §6 — CSP อนุญาต 'unsafe-inline' บน style เพราะ Tailwind v4 บาง utility (เช่น dynamic chart color) แทรก inline style
// script ต้องมี 'unsafe-inline' ด้วย — Next.js App Router (RSC streaming) แทรก <script>self.__next_f.push(...)</script>
// inline เสมอเพื่อ hydrate; ไม่มี nonce middleware ในโปรเจกต์นี้ ถ้า block ตัวนี้แอปจะ hydrate ไม่ได้ (หน้าจอดำ)
// img-src เปิด lh3.googleusercontent.com ไว้รับ avatar จาก Google OAuth
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  // e2e ตั้ง NEXT_DIST_DIR=.next-e2e เพื่อ build ลงโฟลเดอร์แยก — ถ้าใช้ .next ร่วมกับ dev server ที่รันค้างอยู่
  // `next build` จะเขียนทับไฟล์ใต้เท้า dev server ทำให้พังยับด้วย ENOENT รัว ๆ (เจอมาแล้ว ต้อง restart กู้)
  distDir: process.env.NEXT_DIST_DIR ?? ".next",

  async headers() {
    // CSP เข้มงวดไป block Turbopack HMR websocket ตอน dev — ใช้เฉพาะ production build
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
