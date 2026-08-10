import { NextResponse } from "next/server";
import { getHealthReport } from "@/lib/services/health";

export async function GET() {
  const report = await getHealthReport();

  return NextResponse.json({
    data: {
      status: "ok",
      ...report,
      version: process.env.npm_package_version ?? "0.1.0",
    },
  });
}
