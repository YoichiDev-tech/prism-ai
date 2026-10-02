// Shared shapes used across components, hooks and API routes.
// Keeping them in one file means the frontend and the API route agree
// on exactly what a "message" or "conversation" looks like.

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// The shape the /api/chat route accepts from the client.
export interface ChatRequestBody {
  conversationId: string;
  // Full running history, oldest first — the model needs prior turns
  // to hold a coherent conversation, so the client sends them all.
  messages: Pick<ChatMessage, "role" | "content">[];
}

// The shape the /api/chat route returns.
export interface ChatResponseBody {
  reply: string;
}
