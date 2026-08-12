"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import { Send, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { DisclaimerBar } from "@/components/analysis/DisclaimerBar";
import { CitationChip } from "@/components/analysis/CitationChip";
import { ChatCostDialog } from "./ChatCostDialog";
import { useChatHistory, useSendChatMessage } from "@/hooks/useChat";
import { useNews } from "@/hooks/useNews";
import { cn } from "@/lib/utils/cn";

type ModelKey = "standard" | "deep";

// [sourceId] ที่ verifyChatReply เก็บไว้ในข้อความ — ตัดออกจากที่แสดงผล ใช้ sourceIds array แยกแสดงเป็น chip แทน
// (uuid โผล่กลางประโยคอ่านยาก)
const CITATION_MARKER = /\[[a-zA-Z0-9-]+\]/g;

export function ChatPanel({ symbol, session }: { symbol: string; session: Session | null }) {
  const isLoggedIn = Boolean(session?.user);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<{ model: ModelKey; costThb: number } | null>(null);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading, error, refetch } = useChatHistory(symbol, isLoggedIn);
  const { data: news } = useNews(symbol);
  const send = useSendChatMessage(symbol);

  const newsById = new Map((news ?? []).map((n) => [n.id, n]));

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  const sendWith = (model: ModelKey, costThb: number, text: string) => {
    send.mutate({ message: text, model, confirmedCostThb: costThb }, { onSuccess: () => setInput("") });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    if (!confirmed) {
      setDialogOpen(true);
      return;
    }

    sendWith(confirmed.model, confirmed.costThb, text);
  };

  if (!isLoggedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <MessageCircle size={14} className="text-accent" aria-hidden="true" />
            แชทกับ AI
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <EmptyState title="กรุณาเข้าสู่ระบบ" description="เข้าสู่ระบบเพื่อแชทถามข้อมูล/ข่าวของสินทรัพย์นี้กับ AI" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MessageCircle size={14} className="text-accent" aria-hidden="true" />
          แชทกับ AI
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <DisclaimerBar />

        {isLoading && <Skeleton className="h-32 w-full" />}

        {!isLoading && error && (
          <ErrorState message="ดึงประวัติแชทไม่สำเร็จ" code={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
        )}

        {!isLoading && !error && (
          <div ref={listRef} className="flex max-h-96 flex-col gap-2 overflow-y-auto">
            {(messages ?? []).length === 0 && !send.isPending && (
              <EmptyState icon={MessageCircle} title="ยังไม่มีข้อความ" description="พิมพ์คำถามเกี่ยวกับสินทรัพย์นี้ด้านล่าง" />
            )}

            {(messages ?? []).map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    m.role === "user" ? "bg-accent/10 text-fg" : "bg-surface-2 text-fg",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content.replace(CITATION_MARKER, "").trim()}</p>
                  {m.sourceIds.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 border-t border-border-soft pt-1.5">
                      <span className="text-[10px] text-fg-subtle">อ้างอิง</span>
                      <CitationChip sourceIds={m.sourceIds} newsById={newsById} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {send.isPending && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg-subtle">กำลังพิมพ์…</div>
              </div>
            )}
          </div>
        )}

        {send.isError && (
          <p className="text-xs text-down">{send.error instanceof Error ? send.error.message : "ส่งข้อความไม่สำเร็จ"}</p>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="ถามเกี่ยวกับสินทรัพย์นี้…"
            disabled={send.isPending}
            aria-label="พิมพ์ข้อความแชท"
            maxLength={500}
            className="h-10 flex-1 rounded-md border border-border bg-surface-2 px-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:border-accent disabled:opacity-60"
          />
          <Button size="sm" onClick={handleSend} disabled={send.isPending || input.trim().length === 0}>
            <Send size={14} aria-hidden="true" />
          </Button>
        </div>
      </CardContent>

      <ChatCostDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        symbol={symbol}
        onConfirm={(model, costThb) => {
          setConfirmed({ model, costThb });
          setDialogOpen(false);
          const text = input.trim();
          if (text) sendWith(model, costThb, text);
        }}
      />
    </Card>
  );
}
