"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/hooks/useChat";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import type { Conversation } from "@/lib/types";

interface ChatWindowProps {
  activeId: string | null;
  onConversationCreated: (conv: Conversation) => void;
  onOpenSidebar: () => void;
}

export function ChatWindow({
  activeId,
  onConversationCreated,
  onOpenSidebar,
}: ChatWindowProps) {
  const { messages, isSending, error, sendMessage } = useChat(activeId);
  const { speak, isSpeaking, isEnabled, toggleEnabled, isSupported } = useSpeechSynthesis();
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousMessagesLength = useRef(0);

  // Keep the latest message in view as new ones arrive.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Speak new assistant messages automatically
  useEffect(() => {
    if (messages.length > previousMessagesLength.current && isEnabled) {
      const newMessage = messages[messages.length - 1];
      if (newMessage.role === "assistant") {
        speak(newMessage.content);
      }
    }
    previousMessagesLength.current = messages.length;
  }, [messages, isEnabled, speak]);

  async function handleSend(content: string) {
    let conversationId: string | undefined = activeId ?? undefined;

    // No conversation open yet (fresh account, first ever message) —
    // create one on the fly so the person doesn't have to click
    // "+ New chat" before they can say anything.
    if (!conversationId) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: createError } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: content.slice(0, 40) })
        .select()
        .single();

      if (createError || !data) return;

      conversationId = data.id;
      onConversationCreated(data as Conversation);
    }

    // Pass the id explicitly for the "just created it this click" case —
    // see the comment in useChat.sendMessage for why.
    sendMessage(content, conversationId);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Top bar — the hamburger only renders below the md breakpoint;
          on tablet/desktop the sidebar is already always visible. */}
      <header className="flex items-center justify-between border-b border-base-border px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-ink-muted hover:bg-base-raised"
          >
            ☰
          </button>
          <span className="font-mono text-sm text-ink-muted">Ultron</span>
        </div>
        {isSupported && (
          <button
            onClick={toggleEnabled}
            aria-label={isEnabled ? "Disable voice" : "Enable voice"}
            className={`rounded-md p-1.5 transition-colors ${
              isEnabled
                ? "text-ultron hover:bg-base-raised"
                : "text-ink-faint hover:bg-base-raised hover:text-ink-muted"
            }`}
          >
            {isSpeaking ? "🔊" : isEnabled ? "🔈" : "🔇"}
          </button>
        )}
      </header>

      {/* Desktop header with voice control */}
      <header className="hidden items-center justify-between border-b border-base-border px-6 py-3 md:flex">
        <span className="font-mono text-sm text-ink-muted">Ultron</span>
        {isSupported && (
          <button
            onClick={toggleEnabled}
            aria-label={isEnabled ? "Disable voice" : "Enable voice"}
            className={`rounded-md p-1.5 transition-colors ${
              isEnabled
                ? "text-ultron hover:bg-base-raised"
                : "text-ink-faint hover:bg-base-raised hover:text-ink-muted"
            }`}
          >
            {isSpeaking ? "🔊" : isEnabled ? "🔈" : "🔇"}
          </button>
        )}
      </header>

      <div className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold text-ink-primary">
                Welcome to Ultron
              </h2>
              <p className="text-sm text-ink-muted">
                Your startup business assistant. Here's how I can help:
              </p>
            </div>
            <div className="grid max-w-md gap-3 text-sm">
              <button
                onClick={() => handleSend("Help me draft a cold email to potential clients")}
                className="rounded-md border border-base-border px-4 py-3 text-left text-ink-muted transition-colors hover:bg-base-raised hover:text-ink-primary"
              >
                📧 Draft cold outreach emails
              </button>
              <button
                onClick={() => handleSend("Suggest free marketing strategies for my startup")}
                className="rounded-md border border-base-border px-4 py-3 text-left text-ink-muted transition-colors hover:bg-base-raised hover:text-ink-primary"
              >
                📈 Free marketing strategies
              </button>
              <button
                onClick={() => handleSend("Help me analyze my competitors and find opportunities")}
                className="rounded-md border border-base-border px-4 py-3 text-left text-ink-muted transition-colors hover:bg-base-raised hover:text-ink-primary"
              >
                🔍 Competitor analysis
              </button>
              <button
                onClick={() => handleSend("Help me understand what my target customers really need")}
                className="rounded-md border border-base-border px-4 py-3 text-left text-ink-muted transition-colors hover:bg-base-raised hover:text-ink-primary"
              >
                👥 Customer research guidance
              </button>
            </div>
            <p className="text-center text-xs text-ink-faint">
              Or type your own question to get started
            </p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isSending && (
          <p className="px-1 text-sm text-ink-faint">Ultron is thinking…</p>
        )}
        {error && <p className="px-1 text-sm text-spectrum-to">{error}</p>}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}
