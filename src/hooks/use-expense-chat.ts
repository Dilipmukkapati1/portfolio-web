"use client";

import { useCallback, useState } from "react";
import type {
  ExpenseChatMessage,
  ExpenseChatTimeRange,
} from "@portfolio/contracts";
import { defaultExpenseChatTimeRange } from "@portfolio/contracts";
import { usePrivacy } from "@/components/PrivacyProvider";
import { api } from "@/lib/api";

const STARTER_PROMPTS = [
  "Which categories am I over budget on?",
  "Show my spending trend this month",
  "Where did I spend the most?",
  "Compare spending by account",
];

export function useExpenseChat() {
  const { isUnlocked, showUnlockDialog } = usePrivacy();
  const [messages, setMessages] = useState<ExpenseChatMessage[]>([]);
  const [timeRange, setTimeRange] = useState<ExpenseChatTimeRange>(() =>
    defaultExpenseChatTimeRange()
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [rangeNotice, setRangeNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!isUnlocked) {
        showUnlockDialog();
        return;
      }

      const userMessage: ExpenseChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setSending(true);
      setError(null);

      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await api.expenseChat({
          message: trimmed,
          history,
          ...(selectedAccountId ? { accountId: selectedAccountId } : {}),
        });
        setMessages((prev) => [...prev, res.message]);
        setTimeRange(res.timeRange);
        setRangeNotice(res.rangeNotice ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setSending(false);
      }
    },
    [isUnlocked, messages, selectedAccountId, showUnlockDialog]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setRangeNotice(null);
    setTimeRange(defaultExpenseChatTimeRange());
  }, []);

  return {
    messages,
    timeRange,
    selectedAccountId,
    setSelectedAccountId,
    rangeNotice,
    sending,
    error,
    isUnlocked,
    starterPrompts: STARTER_PROMPTS,
    sendMessage,
    clearChat,
    showUnlockDialog,
  };
}
