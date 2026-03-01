/**
 * Gateway Adapters
 *
 * Protocol translators for different claw gateway types.
 * Each adapter knows how to send a message and parse the SSE stream
 * from a specific type of local AI agent.
 */

export interface ChannelEvent {
  type: "content" | "tool_call" | "tool_result" | "error";
  data: Record<string, unknown>;
}

export interface GatewayAdapter {
  name: string;
  send(
    gatewayUrl: string,
    message: string,
    onEvent: (event: ChannelEvent) => void,
    signal?: AbortSignal
  ): Promise<string>;
}

async function readSSEStream(
  body: ReadableStream<Uint8Array>,
  handler: (line: string) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      handler(line);
    }
  }
}

/**
 * PaeanClaw / ZeroClaw adapter
 * Both expose POST /api/chat with SSE response.
 */
export const clawAdapter: GatewayAdapter = {
  name: "claw",

  async send(gatewayUrl, message, onEvent, signal) {
    const url = `${gatewayUrl.replace(/\/$/, "")}/api/chat`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Gateway error: HTTP ${res.status}`);
    }

    let fullContent = "";

    await readSSEStream(res.body, (line) => {
      if (!line.startsWith("data: ")) return;
      try {
        const event = JSON.parse(line.slice(6));
        switch (event.type) {
          case "content":
            fullContent += event.text || "";
            onEvent({ type: "content", data: { text: event.text, partial: true } });
            break;
          case "tool_call":
            onEvent({ type: "tool_call", data: { name: event.name, id: event.name } });
            break;
          case "tool_result":
            onEvent({ type: "tool_result", data: { name: event.name, status: "completed" } });
            break;
          case "done":
            onEvent({ type: "content", data: { text: event.content || fullContent, partial: false } });
            break;
          case "error":
            onEvent({ type: "error", data: { error: event.error } });
            break;
        }
      } catch {
        // skip malformed lines
      }
    });

    return fullContent;
  },
};

/**
 * OpenAI-compatible adapter
 * For any endpoint that speaks POST /v1/chat/completions with SSE.
 */
export const openaiAdapter: GatewayAdapter = {
  name: "openai",

  async send(gatewayUrl, message, onEvent, signal) {
    const url = `${gatewayUrl.replace(/\/$/, "")}/v1/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "default",
        messages: [{ role: "user", content: message }],
        stream: true,
      }),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Gateway error: HTTP ${res.status}`);
    }

    let fullContent = "";

    await readSSEStream(res.body, (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") return;
      try {
        const chunk = JSON.parse(trimmed.slice(6));
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onEvent({ type: "content", data: { text: delta.content, partial: true } });
        }
      } catch {
        // skip
      }
    });

    return fullContent;
  },
};

export function getAdapter(type: string): GatewayAdapter {
  switch (type) {
    case "claw":
    case "paeanclaw":
    case "zeroclaw":
      return clawAdapter;
    case "openai":
      return openaiAdapter;
    default:
      return clawAdapter;
  }
}
