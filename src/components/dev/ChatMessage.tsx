import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ToolCallBlock } from "./ToolCallBlock";
import type { Message } from "@/types";

const THINKING_MESSAGES = [
  "Analyzing your request...",
  "Understanding context...",
  "Planning the approach...",
  "Deep thinking...",
  "Gathering thoughts...",
  "Considering options...",
  "Almost there...",
];

function ThinkingDots() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * THINKING_MESSAGES.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 text-neutral-500">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-claw-400 rounded-full animate-pulse" />
        <span className="w-1.5 h-1.5 bg-claw-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="w-1.5 h-1.5 bg-claw-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
      </span>
      <span className="text-xs terminal-shimmer">{THINKING_MESSAGES[idx]}</span>
    </span>
  );
}

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

      <div className={cn("flex flex-col gap-1.5 min-w-0", isUser && "items-end")}>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolCalls.map((tc) => (
              <ToolCallBlock key={tc.id} toolCall={tc} isStreaming={message.isStreaming} />
            ))}
          </div>
        )}

        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            "break-words",
            isUser
              ? "bg-claw-500/15 text-neutral-100 dark:text-neutral-100 light:text-neutral-900 rounded-br-md whitespace-pre-wrap"
              : cn(
                  "bg-neutral-800/50 dark:bg-neutral-800/50 light:bg-neutral-100",
                  "text-neutral-200 dark:text-neutral-200 light:text-neutral-800",
                  "border border-neutral-700/30 dark:border-neutral-700/30 light:border-neutral-200",
                  "rounded-bl-md"
                )
          )}
        >
          {message.content ? (
            isUser ? (
              message.content
            ) : (
              <MarkdownContent content={message.content} />
            )
          ) : (
            message.isStreaming && <ThinkingDots />
          )}
        </div>

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

function MarkdownContent({ content }: { content: string }) {
  return useMemo(
    () => (
      <div className="prose-chat">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-neutral-100 light:text-neutral-900">{children}</strong>,
            em: ({ children }) => <em className="italic text-neutral-300 light:text-neutral-600">{children}</em>,
            code: ({ children, className }) => {
              if (className?.includes("language-")) {
                return <code className={className}>{children}</code>;
              }
              return (
                <code className="px-1 py-0.5 rounded bg-neutral-700/50 light:bg-neutral-200 text-claw-400 light:text-claw-600 text-xs font-mono">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="my-1.5 p-3 rounded-lg bg-neutral-900/80 light:bg-neutral-50 border border-neutral-700/30 light:border-neutral-200 overflow-x-auto text-xs font-mono">
                {children}
              </pre>
            ),
            ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
            li: ({ children }) => <li className="text-sm">{children}</li>,
            h1: ({ children }) => <h1 className="text-base font-bold mb-1 text-neutral-100 light:text-neutral-900">{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm font-bold mb-1 text-neutral-100 light:text-neutral-900">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mb-0.5 text-neutral-200 light:text-neutral-800">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-claw-500/30 pl-3 my-1.5 text-neutral-400">{children}</blockquote>
            ),
            hr: () => <hr className="border-neutral-700/30 my-2" />,
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-claw-400 underline underline-offset-2 hover:text-claw-300">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    ),
    [content]
  );
}
