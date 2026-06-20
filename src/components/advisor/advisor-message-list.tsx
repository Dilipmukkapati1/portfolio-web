"use client";

import { useRef, useState, useMemo } from "react";
import { Check, Copy, Pencil, X } from "lucide-react";
import type { AdvisorMessage } from "@portfolio/contracts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length === 0 || !listType) return;
    if (listType === "ul") {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="ml-4 list-disc space-y-1">
          {listItems}
        </ul>
      );
    } else {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="ml-4 list-decimal space-y-1">
          {listItems}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed === "---") {
      flushList();
      nodes.push(<hr key={`hr-${i}`} className="my-2 border-border" />);
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      flushList();
      nodes.push(
        <h3 key={`h2-${i}`} className="mt-3 text-sm font-semibold first:mt-0">
          {h2[1]}
        </h3>
      );
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      flushList();
      nodes.push(
        <h4 key={`h3-${i}`} className="mt-2 text-sm font-medium">
          {h3[1]}
        </h4>
      );
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(
        <li key={`li-${i}`} className="text-sm leading-relaxed">
          {renderInline(bullet[1] ?? "")}
        </li>
      );
      continue;
    }

    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(
        <li key={`li-${i}`} className="text-sm leading-relaxed">
          {renderInline(numbered[1] ?? "")}
        </li>
      );
      continue;
    }

    flushList();
    nodes.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1.5">{nodes}</div>;
}

/** h-7 + gap-0.5 + h-7 + pt-0.5 on the action column beside user messages */
const EDIT_ACTIONS_MIN_HEIGHT_PX = 60;

function MessageActions({
  mode,
  content,
  showEdit,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  canSubmitEdit,
  disabled,
  copied,
  onCopy,
  variant,
}: {
  mode: "default" | "editing";
  content: string;
  showEdit?: boolean;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: () => void;
  canSubmitEdit?: boolean;
  disabled?: boolean;
  copied: boolean;
  onCopy: (content: string) => void;
  variant: "user" | "assistant";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-0.5 pt-0.5",
        variant === "user" ? "order-first" : "order-last"
      )}
    >
      {mode === "editing" ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            disabled={disabled}
            onClick={onCancelEdit}
            aria-label="Cancel edit"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            disabled={disabled || !canSubmitEdit}
            onClick={onSubmitEdit}
            aria-label="Save edit"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            disabled={disabled}
            onClick={() => onCopy(content)}
            aria-label={copied ? "Copied" : "Copy message"}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          {showEdit && onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onClick={onEdit}
              aria-label="Edit message"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export function AdvisorMessageList({
  messages,
  sending,
  hideEmptyHint,
  onEditMessage,
}: {
  messages: AdvisorMessage[];
  sending?: boolean;
  hideEmptyHint?: boolean;
  onEditMessage?: (messageId: string, content: string) => void | Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editBubbleSize, setEditBubbleSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  async function handleCopy(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      window.setTimeout(() => setCopiedId((id) => (id === messageId ? null : id)), 2000);
    } catch {
      // ignore clipboard failures
    }
  }

  function startEdit(message: AdvisorMessage) {
    const bubble = bubbleRefs.current.get(message.id);
    if (bubble) {
      setEditBubbleSize({
        width: bubble.offsetWidth,
        height: Math.max(bubble.offsetHeight, EDIT_ACTIONS_MIN_HEIGHT_PX),
      });
    }
    setEditingId(message.id);
    setEditDraft(message.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
    setEditBubbleSize(null);
  }

  async function submitEdit(messageId: string) {
    const trimmed = editDraft.trim();
    if (!trimmed || !onEditMessage) return;
    cancelEdit();
    await onEditMessage(messageId, trimmed);
  }

  const canEdit = Boolean(onEditMessage) && !sending;

  const lastEditableUserMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message?.role === "user" && !message.id.startsWith("pending-")) {
        return message.id;
      }
    }
    return null;
  }, [messages]);

  if (messages.length === 0 && !sending) {
    if (hideEmptyHint) return null;
    return (
      <p className="text-sm text-muted-foreground">
        Ask about tax reduction, deferral strategies, or your current page context.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((m) => {
        const isUser = m.role === "user";
        const isEditing = editingId === m.id;

        return (
          <div
            key={m.id}
            className={cn(
              "flex gap-1",
              isUser ? "ml-auto max-w-[85%] justify-end" : "max-w-[85%] justify-start",
              isUser && isEditing ? "items-stretch" : "items-start"
            )}
          >
            {isUser && (
              <MessageActions
                mode={isEditing ? "editing" : "default"}
                content={m.content}
                showEdit={canEdit && m.id === lastEditableUserMessageId}
                onEdit={() => startEdit(m)}
                onCancelEdit={cancelEdit}
                onSubmitEdit={() => void submitEdit(m.id)}
                canSubmitEdit={Boolean(editDraft.trim())}
                disabled={(!canEdit && !isEditing) || (Boolean(editingId) && !isEditing) || sending}
                copied={copiedId === m.id}
                onCopy={() => void handleCopy(m.id, m.content)}
                variant="user"
              />
            )}

            <div
              ref={(el) => {
                if (el) bubbleRefs.current.set(m.id, el);
                else bubbleRefs.current.delete(m.id);
              }}
              style={
                isEditing && editBubbleSize
                  ? {
                      width: editBubbleSize.width,
                      minWidth: editBubbleSize.width,
                      height: editBubbleSize.height,
                      minHeight: editBubbleSize.height,
                    }
                  : undefined
              }
              className={cn(
                isEditing
                  ? "overflow-hidden rounded-md border border-input bg-background"
                  : cn(
                      "rounded-lg px-3 py-2",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/30"
                    ),
                isUser && !isEditing && "w-fit max-w-full",
                !isUser && !isEditing && "max-w-full"
              )}
            >
              {isEditing ? (
                <Textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="h-full min-h-0 w-full resize-none overflow-y-auto rounded-md border-0 bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  disabled={sending}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitEdit(m.id);
                    }
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
              ) : m.role === "assistant" ? (
                <MessageContent content={m.content} />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              )}
            </div>

            {!isUser && (
              <MessageActions
                mode="default"
                content={m.content}
                disabled={Boolean(editingId)}
                copied={copiedId === m.id}
                onCopy={() => void handleCopy(m.id, m.content)}
                variant="assistant"
              />
            )}
          </div>
        );
      })}
      {sending && (
        <div className="flex justify-start">
          <div className="max-w-[85%] animate-pulse rounded-lg border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
            Thinking…
          </div>
        </div>
      )}
    </div>
  );
}
