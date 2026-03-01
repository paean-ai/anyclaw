import { useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { useApp } from "@/contexts/AppContext";
import { channelSend, channelStream } from "@/lib/api";
import type { ChannelEvent, ToolCall } from "@/types";

export function useChannel() {
  const {
    clawKey,
    connectionState,
    addMessage,
    updateMessage,
  } = useApp();
  const abortRef = useRef<{ abort: () => void } | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!clawKey || connectionState !== "connected") return;

      const userMsgId = nanoid(8);
      addMessage({
        id: userMsgId,
        role: "user",
        content: text,
        timestamp: Date.now(),
      });

      const assistantId = nanoid(8);
      addMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
        toolCalls: [],
      });

      try {
        const requestId = await channelSend(clawKey, text);

        abortRef.current = channelStream(
          clawKey,
          requestId,
          (raw) => {
            const event = raw as ChannelEvent;
            if (event.type === "content") {
              updateMessage(assistantId, {
                content:
                  event.data.text || "",
              });
            } else if (event.type === "tool_call") {
              updateMessage(assistantId, {
                toolCalls: [
                  ...([] as ToolCall[]),
                  {
                    id: event.data.id || nanoid(6),
                    name: event.data.name || "unknown",
                    status: "running",
                  },
                ],
              });
            } else if (event.type === "tool_result") {
              // handled by content updates
            }
          },
          () => {
            updateMessage(assistantId, { isStreaming: false });
            abortRef.current = null;
          },
          (err) => {
            updateMessage(assistantId, {
              isStreaming: false,
              content:
                `Error: ${err}`,
            });
            abortRef.current = null;
          }
        );
      } catch (err) {
        updateMessage(assistantId, {
          isStreaming: false,
          content: `Error: ${err instanceof Error ? err.message : "Failed to send"}`,
        });
      }
    },
    [clawKey, connectionState, addMessage, updateMessage]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { send, cancel };
}
