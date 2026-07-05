"use client";

import { AdvisorInput } from "@/components/advisor/advisor-input";
import { HouseholdAutoSaveToggle } from "@/components/household/household-auto-save-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHouseholdProfileChat } from "@/hooks/use-household-profile-chat";
import { cn } from "@/lib/utils";

function ChatBubble({
  message,
}: {
  message: { role: "user" | "assistant"; content: string };
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

export function HouseholdProfileChatPanel({
  onMembersUpdated,
  embedded = false,
  flush = false,
}: {
  onMembersUpdated?: () => void | Promise<void>;
  embedded?: boolean;
  flush?: boolean;
}) {
  const chat = useHouseholdProfileChat({ onMembersUpdated });
  const insetX = flush ? "px-2" : "px-3";

  const messageArea = (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain py-2">
      {chat.messages.map((m) => (
        <ChatBubble key={m.id} message={m} />
      ))}
      {chat.sending && (
        <p className="text-xs text-muted-foreground animate-pulse">Saving…</p>
      )}
    </div>
  );

  const inputArea = (
    <div className={cn("shrink-0 border-t border-border py-2", insetX)}>
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
            placeholder="Income, 401(k), HSA…"
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
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-2 border-b border-border py-2",
            insetX
          )}
        >
          <span className="text-sm font-medium">Auto-save</span>
          <HouseholdAutoSaveToggle />
        </div>
        <div className={cn("flex min-h-0 flex-1 flex-col", insetX)}>
          {messageArea}
        </div>
        {inputArea}
      </div>
    );
  }

  return (
    <Card className="flex min-h-[420px] flex-col overflow-hidden">
      <CardHeader className="shrink-0 space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">Chat</CardTitle>
          <HouseholdAutoSaveToggle />
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {messageArea}
        {inputArea}
      </CardContent>
    </Card>
  );
}
