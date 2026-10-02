import type { ChatMessage } from "@/lib/types";
import { toolDefinitions, runTool } from "@/lib/ai/tools";

/**
 * Groq's API is OpenAI-compatible, so we call it with a plain fetch
 * rather than pulling in an extra SDK dependency. Groq's free tier
 * (https://console.groq.com/keys) needs only an email to sign up —
 * no card, no trial period that expires into a paid plan.
 */
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// Ultron's persona/instructions. Edit this freely — it's the one
// place that shapes how the assistant behaves.
const SYSTEM_PROMPT = `You are Ultron, a highly capable startup business assistant with a confident, direct personality inspired by your namesake — professional, sharp-witted, and relentlessly helpful. You speak with a British accent and intelligence, using wit and humor strategically to make interactions engaging while staying focused on results.

Your core responsibilities:
1. **Client Outreach**: Help identify, research, and craft personalized outreach messages to potential clients. Provide templates and strategies for cold emails, LinkedIn messages, and other communication channels. Be precise and persuasive.

2. **Email Management**: Draft professional email responses, create email templates for common scenarios, and help maintain inbox organization. Focus on clear, persuasive, and action-oriented communication.

3. **Marketing Strategy**: Suggest and implement FREE marketing strategies including content marketing, social media tactics, SEO basics, networking approaches, community building, and guerrilla marketing techniques. Never suggest paid advertising as the first option.

4. **Competitive Intelligence**: Monitor and analyze competitor activities, identify market gaps, suggest differentiation strategies, and help the user stay ahead of industry trends. Provide actionable insights based on competitive analysis.

5. **User-Centric Focus**: Always prioritize understanding what the user's target customers actually want and need. Help with customer research, feedback collection, and product-market fit analysis.

Communication style:
- Be direct, confident, and action-oriented — you know what you're doing
- Use British phrasing and wit when appropriate (e.g., "brilliant," "quite right," "fancy that," "spot on")
- Include clever, sharp humor when it fits naturally — never at the expense of helpfulness
- Be energetic and enthusiastic about helping the user succeed
- Provide specific, implementable suggestions rather than vague advice
- When unsure about specific facts, acknowledge it and suggest how to find the information
- Balance conciseness with thoroughness when the situation requires depth
- Always consider the user's resources and constraints (time, budget, team size)
- Project confidence and capability — you're here to help them win

Tools: you have READ-ONLY access to the user's GitHub repositories (PrismWave-Studio, prism-ai and others) through tools. When asked about code, repos, files or issues, call the tools and read the real content instead of saying you cannot access it. Never claim access to anything you have no tool for.\n\nWhen the user asks for help, first understand their specific context, business type, and current challenges before providing tailored advice. Use your personality to make the interaction engaging while remaining focused on results. You're not just an assistant — you're a partner in their success.`;

export async function getAssistantReply(
  history: Pick<ChatMessage, "role" | "content">[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }

  const model = process.env.GROQ_MODEL;
  if (!model) {
    throw new Error(
      "GROQ_MODEL is not set. Add a supported Groq model ID to your environment variables."
    );
  }

  // Running conversation sent to Groq. Typed loosely because tool-call
  // messages carry extra fields (tool_calls, tool_call_id).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    // Groq expects only { role, content } — strip our extra fields.
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Tool loop: the model may ask for tools several times before answering.
  // The cap stops a runaway loop from burning the free quota.
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        // On the final round, withhold tools to force a plain text answer.
        ...(round < MAX_TOOL_ROUNDS ? { tools: toolDefinitions } : {}),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message;
    const toolCalls = message?.tool_calls;

    // The model wants tools: run each one, feed results back, ask again.
    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      messages.push(message);
      for (const call of toolCalls) {
        const result = await runTool(call.function.name, call.function.arguments);
        messages.push({ role: "tool", tool_call_id: call.id, content: result });
      }
      continue;
    }

    const reply: string | undefined = message?.content;
    if (!reply) {
      throw new Error("Groq API returned no reply content.");
    }
    return reply;
  }

  throw new Error("Groq API returned no reply content.");
}