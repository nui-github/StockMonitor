// re-export type เดียว (ไม่ดึง runtime code ใด ๆ) จาก lib/ai/schema.ts — ปลอดภัยให้ UI import
// lib/ai/schema.ts เองมี Zod schema + JSON schema ที่แตะโค้ด AI ฝั่ง server ห้าม UI import ตรง (ดู eslint.config.mjs)
export type { Report } from "@/lib/ai/schema";
