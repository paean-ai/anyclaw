export type ClawKeyType = "guest" | "persistent";

export interface ClawKeyInfo {
  id: number;
  key: string;
  routingId: string;
  type: ClawKeyType;
  name: string;
  enabled: boolean;
  lastActiveAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type AppMode = "shell" | "dev";

export interface ChannelEvent {
  type: "content" | "tool_call" | "tool_result" | "done" | "error";
  data: {
    text?: string;
    partial?: boolean;
    id?: string;
    name?: string;
    status?: string;
    error?: string;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "error";
  result?: string;
}
