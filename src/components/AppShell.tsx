"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import type { Conversation } from "@/lib/types";

/**
 * Owns the one piece of state both halves of the app need to agree
 * on — which conversation is currently open — so Sidebar (which sets
 * it) and ChatWindow (which reads it) stay in sync.
 */
export function AppShell({
  initialConversations,
}: {
  initialConversations: Conversation[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  );
  // Sidebar is a permanent column on tablet/desktop (md+) but an
  // overlay drawer on phones, closed by default so the chat gets the
  // whole screen.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="flex h-[100dvh] overflow-hidden">
      {/* Mobile-only backdrop — tapping it closes the sidebar drawer. */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar
        conversations={conversations}
        setConversations={setConversations}
        activeId={activeId}
        setActiveId={(id) => {
          setActiveId(id);
          setIsSidebarOpen(false); // picking a chat closes the drawer on mobile
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <ChatWindow
        activeId={activeId}
        onConversationCreated={(conv) => {
          setConversations((prev) => [conv, ...prev]);
          setActiveId(conv.id);
        }}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </main>
  );
}
