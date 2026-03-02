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
  const contentAccRef = useRef("");
  const toolCallsRef = useRef<ToolCall[]>([]);

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
      contentAccRef.current = "";
      toolCallsRef.current = [];
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
              if (event.data.partial === false) {
                contentAccRef.current = event.data.text || "";
              } else {
                contentAccRef.current += event.data.text || "";
              }
              updateMessage(assistantId, {
                content: contentAccRef.current,
              });
            } else if (event.type === "tool_call") {
              toolCallsRef.current = [
                ...toolCallsRef.current,
                {
                  id: event.data.id || nanoid(6),
                  name: event.data.name || "unknown",
                  status: "running",
                },
              ];
              updateMessage(assistantId, {
                toolCalls: [...toolCallsRef.current],
              });
            } else if (event.type === "tool_result") {
              const toolName = event.data.name;
              toolCallsRef.current = toolCallsRef.current.map((tc) =>
                tc.name === toolName && tc.status === "running"
                  ? { ...tc, status: "completed" as const }
                  : tc
              );
              updateMessage(assistantId, {
                toolCalls: [...toolCallsRef.current],
              });
            }
          },
          () => {
            toolCallsRef.current = toolCallsRef.current.map((tc) => ({
              ...tc,
              status: "completed" as const,
            }));
            updateMessage(assistantId, {
              isStreaming: false,
              toolCalls: [...toolCallsRef.current],
            });
            abortRef.current = null;
          },
          (err) => {
            updateMessage(assistantId, {
              isStreaming: false,
              content: contentAccRef.current || `Error: ${err}`,
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
