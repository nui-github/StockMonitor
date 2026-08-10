// เฉพาะ lib/providers/* — ห้าม import React ที่นี่ (CLAUDE.md ข้อ 1)
import { err, ok, type Result } from "@/lib/utils/result";
import type { ProviderError } from "./types";

const DEFAULT_TIMEOUT_MS = 8000;

export async function fetchJson(
  url: string,
  opts: { provider: string; timeoutMs?: number } = { provider: "unknown" },
): Promise<Result<unknown, ProviderError>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });

    if (res.status === 429) {
      return err({
        code: "RATE_LIMITED",
        message: `${opts.provider} rate limited`,
        provider: opts.provider,
        retryable: true,
      });
    }

    if (!res.ok) {
      return err({
        code: "UPSTREAM_ERROR",
        message: `${opts.provider} responded ${res.status}`,
        provider: opts.provider,
        retryable: res.status >= 500,
      });
    }

    const json: unknown = await res.json();
    return ok(json);
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    return err({
      code: isAbort ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
      message: isAbort ? `${opts.provider} timed out` : `${opts.provider} request failed`,
      provider: opts.provider,
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}
