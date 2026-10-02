import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, ChatResponseBody } from "@/lib/types";

/**
 * Loads a conversation's message history from Supabase, and exposes a
 * `sendMessage` function that:
 *  1. Optimistically shows the user's message right away.
 *  2. Calls /api/chat, which persists both turns server-side and asks
 *     the model for a reply.
 *  3. Appends the assistant's reply once it comes back.
 */
export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setIsLoadingHistory(true);

    const supabase = createClient();
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setMessages((data as ChatMessage[]) ?? []);
          setIsLoadingHistory(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function sendMessage(content: string, conversationIdOverride?: string) {
    // `conversationIdOverride` covers the moment a conversation was just
    // created in this same click — the hook's own `conversationId` prop
    // hasn't re-rendered in yet, so the caller passes the fresh id directly.
    const targetId = conversationIdOverride ?? conversationId;
    if (!targetId || !content.trim()) return;
    setError(null);

    // Show the user's own message immediately — no need to wait on the
    // network round trip to see what you just typed.
    const optimisticUserMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      conversation_id: targetId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: targetId,
          messages: [...messages, optimisticUserMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${response.status}).`);
      }

      const { reply }: ChatResponseBody = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-assistant`,
          conversation_id: targetId,
          role: "assistant",
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  }

  return { messages, isLoadingHistory, isSending, error, sendMessage };
}
