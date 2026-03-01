import { cn } from "@/lib/cn";
import { User, Bot } from "lucide-react";
import { ToolCallBlock } from "./ToolCallBlock";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-3xl",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isUser
            ? "bg-claw-500/20 text-claw-400"
            : "bg-violet-500/20 text-violet-400"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col gap-1.5 min-w-0", isUser && "items-end")}>
        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolCalls.map((tc) => (
              <ToolCallBlock key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            "whitespace-pre-wrap break-words",
            isUser
              ? "bg-claw-500/15 text-neutral-100 dark:text-neutral-100 light:text-neutral-900 rounded-br-md"
              : cn(
                  "bg-neutral-800/50 dark:bg-neutral-800/50 light:bg-neutral-100",
                  "text-neutral-200 dark:text-neutral-200 light:text-neutral-800",
                  "border border-neutral-700/30 dark:border-neutral-700/30 light:border-neutral-200",
                  "rounded-bl-md"
                )
          )}
        >
          {message.content || (
            message.isStreaming && (
              <span className="inline-flex items-center gap-1 text-neutral-500">
                <span className="w-1.5 h-1.5 bg-claw-400 rounded-full animate-pulse" />
                <span
                  className="w-1.5 h-1.5 bg-claw-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-claw-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </span>
            )
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-neutral-600 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
