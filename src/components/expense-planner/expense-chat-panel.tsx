"use client";

import { AdvisorInput } from "@/components/advisor/advisor-input";
import { ExpenseChatBlocks } from "@/components/expense-planner/expense-chat-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenseChat } from "@/hooks/use-expense-chat";
import { cn } from "@/lib/utils";

function ChatBubble({
  message,
  valuesUnlocked,
}: {
  message: {
    role: "user" | "assistant";
    content: string;
    blocks?: import("@portfolio/contracts").ExpenseChatBlock[];
  };
  valuesUnlocked: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(100%,640px)] rounded-lg px-3 py-2",
          isUser
            ? "bg-primary text-primary-foreground text-sm whitespace-pre-wrap"
            : "w-full bg-muted text-foreground"
        )}
      >
        {isUser ? (
          message.content
        ) : message.blocks && message.blocks.length > 0 ? (
          <ExpenseChatBlocks blocks={message.blocks} valuesUnlocked={valuesUnlocked} />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
}

export function ExpenseChatPanel({
  embedded = false,
  flush = false,
}: {
  embedded?: boolean;
  flush?: boolean;
}) {
  const chat = useExpenseChat();
  const insetX = flush ? "px-2" : "px-3";

  const messageArea = (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain py-2">
      {chat.messages.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ask about spending, budgets, trends, or merchants. Each question defaults
            to the current month ({chat.timeRange.label}) unless you specify a range
            (e.g. “last 30 days”).
          </p>
          <div className="flex flex-wrap gap-2">
            {chat.starterPrompts.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto whitespace-normal text-left text-xs"
                disabled={chat.sending || !chat.isUnlocked}
                onClick={() => void chat.sendMessage(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}
      {chat.messages.map((m) => (
        <ChatBubble
          key={m.id}
          message={m}
          valuesUnlocked={chat.isUnlocked}
        />
      ))}
      {chat.sending && (
        <p className="text-xs text-muted-foreground animate-pulse">Analyzing…</p>
      )}
    </div>
  );

  const inputArea = (
    <div className={cn("shrink-0 border-t border-border py-2", insetX)}>
      {chat.rangeNotice && (
        <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
          {chat.rangeNotice}
        </p>
      )}
      <p className="mb-2 text-xs text-muted-foreground">
        Range: {chat.timeRange.label}
      </p>
      {chat.error && (
        <p className="mb-2 text-xs text-destructive" role="alert">
          {chat.error}
        </p>
      )}
      <div className="flex gap-2">
        {chat.messages.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            disabled={chat.sending || !chat.isUnlocked}
            onClick={chat.clearChat}
          >
            Clear
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <AdvisorInput
            onSend={(msg) => void chat.sendMessage(msg)}
            disabled={chat.sending}
            locked={!chat.isUnlocked}
            onLockedFocus={chat.showUnlockDialog}
            placeholder="Ask about spending or say e.g. last 30 days…"
            rows={embedded || flush ? 1 : 2}
          />
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card",
          !flush && "rounded-lg border border-border"
        )}
      >
        <div className={cn("flex min-h-0 flex-1 flex-col", insetX)}>
          {messageArea}
        </div>
        {inputArea}
      </div>
    );
  }

  return (
    <Card className="flex min-h-[420px] flex-col overflow-hidden">
      <CardHeader className="shrink-0 border-b border-border pb-4">
        <CardTitle className="text-lg">Expense analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Chat to explore spending with charts, tables, and summaries.
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {messageArea}
        {inputArea}
      </CardContent>
    </Card>
  );
}
