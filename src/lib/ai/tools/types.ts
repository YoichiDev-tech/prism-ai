// Shared shapes for the assistant's tools layer.
// A "tool" is a server-side function the model can ask us to run.
// The model only ever sees the tool's name, description and result —
// never the secret tokens the function uses internally

// The JSON-schema description sent to Groq so the model knows how to call the tool
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

// One tool = its description for the model + the code that actually runs
export interface Tool {
  definition: ToolDefinition;
  // Receives the arguments the model chose, returns plain text for the model to read
  run: (args: Record<string, unknown>) => Promise<string>;
}