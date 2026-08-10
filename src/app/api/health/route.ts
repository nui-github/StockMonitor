import { NextResponse } from "next/server";

// Phase 0: ยังไม่เชื่อม DB/Redis/provider จริง (ดู docs/09-ROADMAP.md Phase 1)
// endpoint นี้ยืนยันแค่ว่า Next.js server รันอยู่
export async function GET() {
  return NextResponse.json({
    data: {
      status: "ok",
      db: "not_configured",
      redis: "not_configured",
      providers: {},
      version: process.env.npm_package_version ?? "0.1.0",
    },
  });
}
