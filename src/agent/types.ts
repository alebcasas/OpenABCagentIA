export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ToolCallResult {
  tool: string;
  result: string;
}
