"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AdvisorConversationList } from "@/components/advisor/advisor-conversation-list";
import { AdvisorInput } from "@/components/advisor/advisor-input";
import { AdvisorMessageList } from "@/components/advisor/advisor-message-list";
import { Button } from "@/components/ui/button";
import { useAdvisorChat } from "@/hooks/use-advisor-chat";
import { cn } from "@/lib/utils";

function ConversationDrawer({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close conversations"
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card p-4",
              className
            )}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">Chats</p>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ChatMessages({
  messages,
  sending,
  hideEmptyHint,
  loading,
}: {
  messages: ReturnType<typeof useAdvisorChat>["messages"];
  sending: boolean;
  hideEmptyHint?: boolean;
  loading: boolean;
}) {
  if (loading && messages.length === 0) return null;
  return (
    <AdvisorMessageList
      messages={messages}
      sending={sending}
      hideEmptyHint={hideEmptyHint}
    />
  );
}

export function AdvisorChatPanel({
  embedded = false,
  compact = false,
  flush = false,
}: {
  embedded?: boolean;
  compact?: boolean;
  flush?: boolean;
}) {
  const state = useAdvisorChat();
  const [draftSent, setDraftSent] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (draftSent || !state.initialPrompt || state.activeConversation) return;
    if (!state.isUnlocked) return;
    setDraftSent(true);
    void state.sendMessage(state.initialPrompt);
  }, [
    draftSent,
    state.initialPrompt,
    state.activeConversation,
    state.isUnlocked,
    state.sendMessage,
  ]);

  const conversationList = (
    <AdvisorConversationList
      conversations={state.conversations}
      activeId={state.activeConversation?.id}
      onSelect={(id) => {
        void state.selectConversation(id);
        setListOpen(false);
      }}
      onNew={() => {
        state.startNewChat();
        setListOpen(false);
      }}
      onDelete={(id) => void state.deleteConversation(id)}
    />
  );

  const chatsButton = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setListOpen(true)}
      aria-label="Chats"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );

  const inputFooter = (
    <>
      {state.error && (
        <p
          className={cn("mb-2 text-xs text-destructive sm:text-sm")}
          role="alert"
        >
          {state.error}
        </p>
      )}
      <AdvisorInput
        onSend={(msg) => void state.sendMessage(msg)}
        disabled={state.sending}
        initialValue={state.messages.length ? "" : state.initialPrompt}
        placeholder={embedded || compact ? "Message…" : undefined}
        rows={embedded || compact ? 1 : 2}
        actionAboveSend={compact ? chatsButton : undefined}
      />
    </>
  );

  const insetX = compact ? "px-0" : "px-3";
  const panelShell = cn(
    "flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card",
    !flush && "rounded-lg border border-border"
  );

  const chatToolbar = (
    <div className={cn("flex shrink-0 items-center border-b border-border py-2", insetX)}>
      <Button variant="outline" size="sm" onClick={() => setListOpen(true)}>
        <Menu className="mr-2 h-4 w-4" />
        Chats
      </Button>
    </div>
  );

  if (compact) {
    return (
      <div className={panelShell}>
        <ConversationDrawer open={listOpen} onClose={() => setListOpen(false)}>
          {conversationList}
        </ConversationDrawer>

        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain py-2", insetX)}>
          <ChatMessages
            messages={state.messages}
            sending={state.sending}
            hideEmptyHint
            loading={state.loading}
          />
        </div>

        <div className={cn("shrink-0 border-t border-border px-0 py-2")}>
          {inputFooter}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        embedded
          ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          : "mx-auto flex max-w-[1200px] flex-col gap-4"
      )}
    >
      <div
        className={cn(
          "grid h-full min-h-0 flex-1 overflow-hidden",
          embedded ? "grid-cols-[200px_1fr]" : "min-h-[560px] grid-cols-[220px_1fr] gap-4"
        )}
      >
        <aside
          className={cn(
            "hidden min-h-0 overflow-y-auto bg-card sm:block",
            flush ? "border-r border-border p-2" : "rounded-lg border border-border p-3"
          )}
        >
          {conversationList}
        </aside>

        <main className={cn("flex min-h-0 flex-col overflow-hidden bg-card", !flush && "rounded-lg border border-border")}>
          <div className="shrink-0 sm:hidden">{chatToolbar}</div>

          <ConversationDrawer open={listOpen} onClose={() => setListOpen(false)}>
            {conversationList}
          </ConversationDrawer>

          <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain py-2", insetX)}>
            <ChatMessages
              messages={state.messages}
              sending={state.sending}
              hideEmptyHint={embedded}
              loading={state.loading}
            />
          </div>

          {!state.isUnlocked && !embedded && (
            <p className="shrink-0 px-4 pb-2 text-sm text-muted-foreground">
              Unlock privacy to send messages.{" "}
              <button
                type="button"
                className="text-primary underline"
                onClick={state.showUnlockDialog}
              >
                Unlock
              </button>
            </p>
          )}

          <div className="shrink-0 border-t border-border p-3 py-2">
            {inputFooter}
          </div>
        </main>
      </div>
    </div>
  );
}
