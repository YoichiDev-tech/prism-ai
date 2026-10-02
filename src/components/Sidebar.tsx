"use client";

import { createClient } from "@/lib/supabase/client";
import type { Conversation } from "@/lib/types";

interface SidebarProps {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeId: string | null;
  setActiveId: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  conversations,
  setConversations,
  activeId,
  setActiveId,
  isOpen,
  onClose,
}: SidebarProps) {
  const supabase = createClient();

  async function handleNewChat() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New chat" })
      .select()
      .single();

    if (!error && data) {
      setConversations((prev) => [data as Conversation, ...prev]);
      setActiveId(data.id);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside
      // Desktop/tablet (md+): a normal in-flow column, always visible.
      // Phone (below md): a fixed drawer that slides in over the chat,
      // so the chat itself gets the full narrow width when closed.
      className={`fixed inset-y-0 left-0 z-30 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-base-border bg-base-surface transition-transform duration-200 ease-out
        md:static md:z-auto md:w-64 md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Brand mark — the one place the full spectrum accent appears. */}
      <div className="ultron-edge h-[3px] w-full shrink-0" />

      <div className="flex items-center justify-between px-4 py-4">
        <span className="font-mono text-sm text-ink-muted">Ultron</span>
        {/* Close button only makes sense on the mobile drawer. */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-md p-1 text-ink-muted hover:bg-base-raised md:hidden"
        >
          ✕
        </button>
      </div>

      <div className="px-3">
        <button
          onClick={handleNewChat}
          className="w-full rounded-md border border-base-border px-3 py-2 text-left text-sm text-ink-primary transition-colors hover:bg-base-raised"
        >
          + New chat
        </button>
      </div>

      <nav className="thin-scroll mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {conversations.length === 0 && (
          <p className="px-1 py-4 text-sm text-ink-faint">
            No conversations yet.
          </p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setActiveId(conv.id)}
            className={`block w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors ${
              conv.id === activeId
                ? "bg-ultron text-white"
                : "text-ink-muted hover:bg-base-raised hover:text-ink-primary"
            }`}
          >
            {conv.title}
          </button>
        ))}
      </nav>

      <div className="border-t border-base-border px-3 py-3">
        <button
          onClick={handleSignOut}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-base-raised hover:text-ink-primary"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
