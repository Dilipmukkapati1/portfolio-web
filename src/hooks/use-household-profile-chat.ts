"use client";

import { useCallback, useState } from "react";
import type { HouseholdProfileChatMessage } from "@portfolio/contracts";
import { useHousehold } from "@/components/HouseholdProvider";
import { usePrivacy } from "@/components/PrivacyProvider";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export function useHouseholdProfileChat(options?: {
  onMembersUpdated?: () => void | Promise<void>;
}) {
  const { isUnlocked, showUnlockDialog } = usePrivacy();
  const { refresh: refreshHousehold } = useHousehold();
  const [messages, setMessages] = useState<HouseholdProfileChatMessage[]>([]);
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

      const userMessage: HouseholdProfileChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setSending(true);
      setError(null);

      try {
        const res = await api.householdProfileChat({ message: trimmed });
        setMessages((prev) => [...prev, res.message]);

        if (res.autoSave?.applied) {
          toast({
            title: "Profile updated",
            description: res.message.content,
          });
          await refreshHousehold();
          await options?.onMembersUpdated?.();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setSending(false);
      }
    },
    [
      isUnlocked,
      options,
      refreshHousehold,
      showUnlockDialog,
    ]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sending,
    error,
    isUnlocked,
    sendMessage,
    clearChat,
    showUnlockDialog,
  };
}
