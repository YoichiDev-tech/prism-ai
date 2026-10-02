import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAssistantReply } from "@/lib/ai/groq";
import type { ChatRequestBody, ChatResponseBody } from "@/lib/types";

// Hard caps — these are the actual security/abuse boundaries for this
// route, not just UX limits. Keeping them here means the client can't
// send anything the server didn't explicitly agree to accept.
const MAX_MESSAGE_LENGTH = 4000; // characters, per message
const MAX_HISTORY_LENGTH = 40; // messages sent as context per request
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 12; // user turns per window

/**
 * POST /api/chat
 * Body: { conversationId, messages }
 *
 * 1. Confirms the caller is logged in.
 * 2. Confirms the conversation belongs to them (RLS double-checks this
 *    too, but we check explicitly for a clean error message).
 * 3. Validates and rate-limits the request.
 * 4. Saves the user's new message.
 * 5. Asks Groq for a reply.
 * 6. Saves the assistant's reply.
 * 7. Returns the reply so the UI can show it immediately.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const { conversationId, messages } = body;

  if (!conversationId || typeof conversationId !== "string" || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "conversationId and messages are required." },
      { status: 400 }
    );
  }

  // --- Input validation ---
  // Everything below is untrusted client input. Reject anything that
  // doesn't match the exact shape and size we expect before it touches
  // the database or gets forwarded to the model.
  if (messages.length > MAX_HISTORY_LENGTH) {
    return NextResponse.json(
      { error: `Conversation history too long (max ${MAX_HISTORY_LENGTH} messages per request).` },
      { status: 413 }
    );
  }

  for (const m of messages) {
    if (
      !m ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.length === 0
    ) {
      return NextResponse.json({ error: "Malformed message in history." }, { status: 400 });
    }
    if (m.content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters).` },
        { status: 413 }
      );
    }
  }

  // Ownership check — belt-and-braces alongside the RLS policy.
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }

  // --- Rate limiting ---
  // Backed by the messages table itself (not in-memory) so it holds up
  // across serverless invocations, which don't share memory between
  // requests. This protects your free Groq quota from a runaway client,
  // a bug, or someone else's script — not just from bad actors.
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: recentCount } = await supabase
    .from("messages")
    .select("id, conversations!inner(user_id)", { count: "exact", head: true })
    .eq("role", "user")
    .eq("conversations.user_id", user.id)
    .gte("created_at", windowStart);

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: "You're sending messages too quickly. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  // The last item in `messages` is the new user turn the client hasn't
  // saved yet — persist it before calling the model.
  const lastMessage = messages[messages.length - 1];
  const { error: insertUserError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: lastMessage.role,
    content: lastMessage.content,
  });

  if (insertUserError) {
    return NextResponse.json(
      { error: `Failed to save message: ${insertUserError.message}` },
      { status: 500 }
    );
  }

  let reply: string;
  try {
    reply = await getAssistantReply(messages);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { error: insertAssistantError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: "assistant",
      content: reply,
    });

  if (insertAssistantError) {
    return NextResponse.json(
      { error: `Failed to save reply: ${insertAssistantError.message}` },
      { status: 500 }
    );
  }

  // Bump updated_at so the sidebar can sort by most-recently-active.
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  const responseBody: ChatResponseBody = { reply };
  return NextResponse.json(responseBody);
}
