"use client";

import { useState, type ReactNode } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <div className="flex items-end gap-2">
      <Textarea
        className="min-w-0 flex-1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <div className="flex shrink-0 flex-col gap-1">
        {actionAboveSend}
        <Button
          type="button"
          size="icon"
          disabled={disabled || !value.trim()}
          onClick={handleSend}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
