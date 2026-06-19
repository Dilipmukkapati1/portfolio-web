"use client";

import type { AdvisorMessage } from "@portfolio/contracts";
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

export function AdvisorMessageList({
  messages,
  sending,
  hideEmptyHint,
}: {
  messages: AdvisorMessage[];
  sending?: boolean;
  hideEmptyHint?: boolean;
}) {
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
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2",
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-muted/30"
            )}
          >
            {m.role === "assistant" ? (
              <MessageContent content={m.content} />
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
            )}
          </div>
        </div>
      ))}
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
