"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import type {
  ExpenseChatHistoryMessage,
  ExpenseChatMessage,
} from "@portfolio/contracts";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatBlock } from "./chat-block";
import type { useExpensePlanner } from "@/hooks/use-expense-planner";

type PlannerState = ReturnType<typeof useExpensePlanner>;

const SUGGESTIONS = [
  "What did I spend the most on this period?",
  "How does my spending compare to my budget?",
  "Show my top merchants as a table",
  "Break down spending by category",
];

let idSeq = 0;
function nextId() {
  idSeq += 1;
  return `local-${idSeq}`;
}

export function ChatTab({ state }: { state: PlannerState }) {
  const [messages, setMessages] = useState<ExpenseChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const valuesUnlocked = state.valuesUnlocked;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMessage: ExpenseChatMessage = {
      id: nextId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    const history: ExpenseChatHistoryMessage[] = nextMessages
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await api.postExpenseChat({
        message: trimmed,
        timeRange: {
          startDate: state.range.startDate,
          endDate: state.range.endDate,
          label: state.range.label,
        },
        history,
      });
      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Chat request failed";
      setError(message);
      // Roll back the optimistic user message so it can be retried.
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[420px] flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto pr-1"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && !sending && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium">Ask about your expenses</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Analyzing {state.range.label}. Ask about spending, budgets, or trends.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] space-y-3 rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "w-full max-w-full border border-border bg-card"
              )}
            >
              {message.role === "user" ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : message.blocks && message.blocks.length > 0 ? (
                message.blocks.map((block, i) => (
                  <ChatBlock key={i} block={block} valuesUnlocked={valuesUnlocked} />
                ))
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Analyzing…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <form
        className="mt-3 flex items-end gap-2 border-t border-border pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder="Ask about your expenses…"
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" disabled={sending || !input.trim()}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
