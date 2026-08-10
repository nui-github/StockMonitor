import { z } from "zod";
import { getQuotes } from "@/lib/services/quotes";

export const runtime = "nodejs";
export const maxDuration = 300;

const POLL_MS = 3_000;
const HEARTBEAT_MS = 15_000;

const QuerySchema = z.object({
  symbols: z
    .string()
    .min(1)
    .transform((s) => s.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean))
    .refine((arr) => arr.length > 0 && arr.length <= 20, "symbols ต้องมี 1-20 ตัว"),
});

// SSE — ยิงราคาทุก ๆ POLL_MS จนกว่า client จะตัดการเชื่อมต่อ (docs/01 §3 Path A)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ symbols: searchParams.get("symbols") ?? undefined });

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: { code: "INVALID_QUERY", message: parsed.error.issues[0]?.message } }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const symbols = parsed.data.symbols;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const pollOnce = async () => {
        if (closed) return;
        const { quotes, failed } = await getQuotes(symbols);
        for (const q of quotes) send("quote", q);
        if (failed.length > 0) send("status", { failed });
      };

      void pollOnce();
      const pollInterval = setInterval(() => void pollOnce(), POLL_MS);
      const heartbeatInterval = setInterval(() => send("heartbeat", { ts: Date.now() }), HEARTBEAT_MS);

      const cleanup = () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
      };

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // stream อาจถูกปิดไปแล้ว
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
