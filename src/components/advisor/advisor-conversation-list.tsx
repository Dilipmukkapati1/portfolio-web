"use client";

import { Trash2 } from "lucide-react";
import type { AdvisorConversationSummary } from "@portfolio/contracts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdvisorConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: AdvisorConversationSummary[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Button onClick={onNew} className="w-full">
        New chat
      </Button>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {conversations.map((c) => (
          <div
            key={c.id}
            className={cn(
              "group flex items-start gap-2 rounded-md border border-transparent px-2 py-2 hover:bg-muted/50",
              activeId === c.id && "border-border bg-muted/40"
            )}
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onSelect(c.id)}
            >
              <p className="truncate text-sm font-medium">{c.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.messageCount} messages
              </p>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={() => onDelete(c.id)}
              aria-label="Delete conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
