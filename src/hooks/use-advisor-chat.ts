"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  AdvisorConversation,
  AdvisorConversationSummary,
  AdvisorMessage,
  AdvisorPageContext,
} from "@portfolio/contracts";
import { composeAdvisorPageContext } from "@portfolio/contracts";
import { api } from "@/lib/api";
import {
  readAdvisorPageContext,
  clearAdvisorPageContext,
} from "@/lib/advisor/page-context";
import { usePrivacy } from "@/components/PrivacyProvider";

export function useAdvisorChat() {
  const searchParams = useSearchParams();
  const { isUnlocked, showUnlockDialog } = usePrivacy();
  const [conversations, setConversations] = useState<AdvisorConversationSummary[]>([]);
  const [activeConversation, setActiveConversation] = useState<AdvisorConversation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvePageContextForSend = useCallback((): AdvisorPageContext => {
    const stored = readAdvisorPageContext();
    if (stored) return stored;
    const from = searchParams.get("from") ?? "/tax";
    return composeAdvisorPageContext(from);
  }, [searchParams]);

  const pageContext = useMemo((): AdvisorPageContext => {
    return resolvePageContextForSend();
  }, [resolvePageContextForSend]);

  const initialPrompt = searchParams.get("prompt") ?? "";

  const loadConversations = useCallback(async () => {
    setError(null);
    try {
      const res = await api.listAdvisorConversations();
      setConversations(res.conversations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const selectConversation = useCallback(async (conversationId: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.getAdvisorConversation(conversationId);
      setActiveConversation(res.conversation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setActiveConversation(null);
    setError(null);
  }, []);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      await api.deleteAdvisorConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
    },
    [activeConversation?.id]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      if (!isUnlocked) {
        showUnlockDialog();
        return;
      }

      setSending(true);
      setError(null);

      const isNewConversation =
        !activeConversation || activeConversation.id === "pending";
      const ctx = isNewConversation ? resolvePageContextForSend() : undefined;

      const optimisticUser: AdvisorMessage = {
        id: `pending-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      if (activeConversation) {
        setActiveConversation({
          ...activeConversation,
          messages: [...activeConversation.messages, optimisticUser],
        });
      } else {
        setActiveConversation({
          id: "pending",
          householdId: "",
          title: trimmed.slice(0, 60),
          taxYear: new Date().getFullYear(),
          pageContext: ctx,
          messages: [optimisticUser],
          createdAt: optimisticUser.createdAt,
          updatedAt: optimisticUser.createdAt,
        });
      }

      const conversationId =
        activeConversation && activeConversation.id !== "pending"
          ? activeConversation.id
          : undefined;

      try {
        const res = await api.advisorChat({
          conversationId,
          message: trimmed,
          ...(ctx ? { pageContext: ctx } : {}),
        });

        const full = await api.getAdvisorConversation(res.conversationId);
        setActiveConversation(full.conversation);

        if (isNewConversation) {
          clearAdvisorPageContext();
        }

        await loadConversations();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send message");
        if (conversationId) {
          void selectConversation(conversationId);
        } else {
          setActiveConversation(null);
        }
      } finally {
        setSending(false);
      }
    },
    [
      activeConversation,
      isUnlocked,
      loadConversations,
      resolvePageContextForSend,
      selectConversation,
      showUnlockDialog,
    ]
  );

  const editMessage = useCallback(
    async (messageId: string, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      if (!isUnlocked) {
        showUnlockDialog();
        return;
      }

      if (!activeConversation || activeConversation.id === "pending") {
        return;
      }

      setSending(true);
      setError(null);

      const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) {
        setSending(false);
        return;
      }

      const updatedUser: AdvisorMessage = {
        ...activeConversation.messages[msgIndex]!,
        content: trimmed,
      };
      setActiveConversation({
        ...activeConversation,
        messages: [
          ...activeConversation.messages.slice(0, msgIndex),
          updatedUser,
        ],
      });

      try {
        const res = await api.advisorChat({
          conversationId: activeConversation.id,
          message: trimmed,
          editMessageId: messageId,
        });

        const full = await api.getAdvisorConversation(res.conversationId);
        setActiveConversation(full.conversation);
        await loadConversations();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to edit message");
        void selectConversation(activeConversation.id);
      } finally {
        setSending(false);
      }
    },
    [
      activeConversation,
      isUnlocked,
      loadConversations,
      selectConversation,
      showUnlockDialog,
    ]
  );

  const messages: AdvisorMessage[] = activeConversation?.messages ?? [];

  const starterPrompts =
    pageContext.starterPrompts ?? pageContext.scopeTopics.map((t) => `Tell me about ${t.replace(/_/g, " ")}`);

  return {
    conversations,
    activeConversation,
    messages,
    initialPrompt,
    loading,
    sending,
    error,
    isUnlocked,
    starterPrompts,
    loadConversations,
    selectConversation,
    startNewChat,
    deleteConversation,
    sendMessage,
    editMessage,
    showUnlockDialog,
  };
}
