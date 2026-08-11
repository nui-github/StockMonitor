// fetch wrapper ฝั่ง client — คุยกับ /api/v1/* ของเราเอง (ไม่ใช่ provider ตรง ๆ)
export class ApiClientError extends Error {
  code: string;
  status: number;
  retryable: boolean;

  constructor(code: string, message: string, status: number, retryable: boolean) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

interface ErrorEnvelope {
  error: { code: string; message: string; retryable: boolean };
}

interface OkEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<OkEnvelope<T>> {
  const res = await fetch(path, init);
  const json: unknown = await res.json();

  if (!res.ok) {
    const e = json as ErrorEnvelope;
    throw new ApiClientError(
      e.error?.code ?? "UNKNOWN_ERROR",
      e.error?.message ?? "เกิดข้อผิดพลาด",
      res.status,
      e.error?.retryable ?? false,
    );
  }

  return json as OkEnvelope<T>;
}

async function apiMutate(path: string, method: string, body?: unknown): Promise<void> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 204) {
    const json: unknown = await res.json().catch(() => null);
    const e = json as ErrorEnvelope | null;
    throw new ApiClientError(e?.error?.code ?? "UNKNOWN_ERROR", e?.error?.message ?? "เกิดข้อผิดพลาด", res.status, e?.error?.retryable ?? false);
  }
}

export const apiPost = (path: string, body?: unknown) => apiMutate(path, "POST", body);
export const apiDelete = (path: string, body?: unknown) => apiMutate(path, "DELETE", body);
