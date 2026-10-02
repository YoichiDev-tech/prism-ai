import type { ChatMessage } from "@/lib/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm leading-relaxed sm:max-w-[75ch] ${
          isUser
            ? "bg-ultron text-white"
            : "bg-base-surface text-ink-primary"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
