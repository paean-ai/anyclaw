import { cn } from "@/lib/cn";
import type { Message } from "@/types";
import { ChevronRight, Wrench, Check, Loader2 } from "lucide-react";

interface TerminalOutputProps {
  messages: Message[];
}

export function TerminalOutput({ messages }: TerminalOutputProps) {
  return (
    <div className="space-y-2 font-terminal text-sm">
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.role === "user" && (
            <div className="flex items-start gap-1">
              <ChevronRight size={14} className="text-claw-400 mt-0.5 shrink-0" />
              <span className="text-neutral-300">{msg.content}</span>
            </div>
          )}

          {msg.role === "assistant" && (
            <div className="space-y-1">
              {msg.toolCalls?.map((tc) => (
                <div key={tc.id} className="flex items-center gap-1.5 text-xs">
                  {tc.status === "running" ? (
                    <Loader2 size={12} className="text-warn-400 animate-spin" />
                  ) : (
                    <Check size={12} className="text-term-400" />
                  )}
                  <Wrench size={12} className="text-neutral-600" />
                  <span className="text-neutral-500">{tc.name}</span>
                </div>
              ))}

              <div
                className={cn(
                  "text-neutral-200 whitespace-pre-wrap",
                  msg.isStreaming && "border-r-2 border-claw-400"
                )}
              >
                {msg.content || (
                  msg.isStreaming && (
                    <span className="text-neutral-600">thinking...</span>
                  )
                )}
              </div>
            </div>
          )}

          {msg.role === "system" && (
            <div className="text-neutral-600 text-xs">{msg.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
