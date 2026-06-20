"use client";

import { useState, type ReactNode } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function AdvisorInput({
  onSend,
  disabled,
  initialValue = "",
  placeholder = "Ask about tax reduction or deferral…",
  rows = 2,
  actionAboveSend,
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialValue?: string;
  placeholder?: string;
  rows?: number;
  actionAboveSend?: ReactNode;
}) {
  const [value, setValue] = useState(initialValue);

  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  }

  const stackedActions = Boolean(actionAboveSend);

  return (
    <div className={cn("flex gap-2", stackedActions ? "items-stretch" : "items-end")}>
      <Textarea
        className={cn(
          "min-w-0 flex-1",
          stackedActions &&
            "h-[5.25rem] min-h-[5.25rem] resize-none py-2.5 leading-snug focus-visible:ring-offset-0"
        )}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={stackedActions ? 2 : rows}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      {stackedActions ? (
        <div className="flex w-10 shrink-0 flex-col gap-1">
          <div className="flex min-h-0 flex-1 [&_button]:h-full [&_button]:w-full">
            {actionAboveSend}
          </div>
          <Button
            type="button"
            size="icon"
            className="h-auto min-h-0 w-full flex-1"
            disabled={disabled || !value.trim()}
            onClick={handleSend}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="icon"
          disabled={disabled || !value.trim()}
          onClick={handleSend}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
