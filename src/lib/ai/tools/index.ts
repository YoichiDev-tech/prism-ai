import type { Tool, ToolDefinition } from "./types";
import { githubTools } from "./github";

// The registry: every tool the assistant can use, in one place.
// To give the assistant a new ability later (PrismWave dashboard hub,
// PrismStack, ...), create a file like github.ts and spread it in here.
const allTools: Record<string, Tool> = {
  ...githubTools,
};

// Sent to Groq so the model knows what it may call.
export const toolDefinitions: ToolDefinition[] = Object.values(allTools).map(
  (t) => t.definition
);

// Runs one tool call requested by the model. Never throws — errors are
// returned as text so the model can explain them instead of the chat crashing.
export async function runTool(name: string, rawArgs: string): Promise<string> {
  const tool = allTools[name];
  if (!tool) return `Error: unknown tool "${name}".`;

  try {
    const args = rawArgs ? JSON.parse(rawArgs) : {};
    return await tool.run(args);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : "tool failed"}`;
  }
}