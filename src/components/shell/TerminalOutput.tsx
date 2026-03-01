import { cn } from "@/lib/cn";
import type { Message } from "@/types";
import { ChevronRight, Wrench, Check, Loader2 } from "lucide-react";

interface TerminalOutputProps {
  messages: Message[];
}

/** Detect system message type for color coding */
function getSystemMsgStyle(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("error") || lower.includes("failed")) {
    return "text-error-400";
  }
  if (lower.includes("connected") || lower.includes("created") || lower.includes("copied") || lower.includes("[  ok  ]")) {
    return "text-term-400/80";
  }
  if (lower.includes("offline") || lower.includes("warning") || lower.includes("expires") || lower.includes("disconnect")) {
    return "text-warn-400/80";
  }
  if (lower.includes("tip:") || lower.includes("curl") || lower.includes("install")) {
    return "text-claw-400/70";
  }
  return "text-neutral-500";
}

export function TerminalOutput({ messages }: TerminalOutputProps) {
  return (
    <div className="space-y-1.5 font-terminal text-sm">
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.role === "user" && (
            <div className="flex items-start gap-1">
              <ChevronRight size={14} className="text-claw-400 mt-0.5 shrink-0" />
              <span className="text-neutral-200">{msg.content}</span>
            </div>
          )}

          {msg.role === "assistant" && (
            <div className="space-y-1 pl-2 border-l-2 border-violet-500/30 ml-1">
              {msg.toolCalls?.map((tc) => (
                <div key={tc.id} className="flex items-center gap-1.5 text-xs">
                  {tc.status === "running" ? (
                    <Loader2 size={12} className="text-warn-400 animate-spin" />
                  ) : (
                    <Check size={12} className="text-term-400" />
                  )}
                  <Wrench size={12} className="text-neutral-600" />
                  <span className="text-neutral-500 font-mono">{tc.name}</span>
                </div>
              ))}

              <div
                className={cn(
                  "text-neutral-200 whitespace-pre-wrap leading-relaxed",
                  msg.isStreaming && "border-r-2 border-claw-400"
                )}
              >
                {msg.content || (
                  msg.isStreaming && (
                    <span className="text-neutral-600 italic">thinking...</span>
                  )
                )}
              </div>
            </div>
          )}

          {msg.role === "system" && (
            <div
              className={cn(
                "text-xs whitespace-pre-wrap leading-relaxed",
                getSystemMsgStyle(msg.content)
              )}
            >
              {msg.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
