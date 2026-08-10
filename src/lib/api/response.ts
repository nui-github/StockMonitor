import { NextResponse } from "next/server";

export function apiOk<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json({ data, ...(init?.meta ? { meta: init.meta } : {}) }, { status: init?.status ?? 200 });
}

export function apiError(
  code: string,
  message: string,
  init?: { status?: number; retryable?: boolean; retryAfterSeconds?: number },
) {
  const headers: Record<string, string> = {};
  if (init?.retryAfterSeconds) headers["Retry-After"] = String(init.retryAfterSeconds);

  return NextResponse.json(
    { error: { code, message, retryable: init?.retryable ?? false } },
    { status: init?.status ?? 400, headers },
  );
}
