import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import type { Message } from "@/types";
import { ChevronRight, Wrench, Check, Loader2 } from "lucide-react";

interface TerminalOutputProps {
  messages: Message[];
}

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

const THINKING_MESSAGES = [
  "⊂ Analyzing your request...",
  "⌒ Understanding context...",
  "⊃ Planning the approach...",
  "⌓ Deep thinking...",
  "⊅ Gathering thoughts...",
  "⊄ Considering options...",
  "∩ Almost there...",
];

function ThinkingIndicator() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * THINKING_MESSAGES.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="terminal-shimmer text-neutral-500 italic text-xs">
      {THINKING_MESSAGES[idx]}
    </span>
  );
}

function renderTerminalMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let blockKey = 0;

  const flushCode = () => {
    result.push(
      <div key={`code-${blockKey++}`} className="my-1 rounded bg-neutral-900/60 border border-neutral-800/50 overflow-hidden">
        {codeLang && (
          <div className="px-2 py-0.5 text-[10px] text-neutral-600 bg-neutral-800/40 border-b border-neutral-800/50">
            {codeLang}
          </div>
        )}
        <pre className="px-2 py-1.5 text-xs overflow-x-auto text-neutral-300">
          {codeLines.join("\n")}
        </pre>
      </div>
    );
    codeLines = [];
    codeLang = "";
  };

  const renderInline = (line: string, key: number): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partKey = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);

      type Candidate = { idx: number; len: number; node: React.ReactNode };
      const candidates: Candidate[] = [];

      if (boldMatch && boldMatch.index !== undefined) {
        candidates.push({
          idx: boldMatch.index,
          len: boldMatch[0].length,
          node: <strong key={`b-${partKey++}`} className="text-neutral-100 font-semibold">{boldMatch[1]}</strong>,
        });
      }
      if (codeMatch && codeMatch.index !== undefined) {
        candidates.push({
          idx: codeMatch.index,
          len: codeMatch[0].length,
          node: <code key={`c-${partKey++}`} className="px-1 py-0.5 rounded bg-neutral-800/60 text-claw-400 text-xs">{codeMatch[1]}</code>,
        });
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => a.idx - b.idx);
        const earliest = candidates[0];
        if (earliest.idx > 0) {
          parts.push(remaining.slice(0, earliest.idx));
        }
        parts.push(earliest.node);
        remaining = remaining.slice(earliest.idx + earliest.len);
      } else {
        parts.push(remaining);
        remaining = "";
      }
    }

    return <span key={key}>{parts}</span>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#{1,3})/)?.[1].length || 1;
      const text = line.replace(/^#{1,3}\s+/, "");
      const sizeClass = level === 1 ? "text-sm font-bold" : level === 2 ? "text-sm font-semibold" : "text-xs font-semibold";
      result.push(
        <div key={`h-${i}`} className={`${sizeClass} text-claw-400 ${i > 0 ? "mt-1" : ""}`}>
          {renderInline(text, i)}
        </div>
      );
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      result.push(
        <div key={`li-${i}`} className="flex gap-1">
          <span className="text-neutral-600 shrink-0">•</span>
          <span>{renderInline(line.replace(/^[-*]\s+/, ""), i)}</span>
        </div>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      result.push(
        <div key={`ol-${i}`} className="flex gap-1">
          <span className="text-neutral-500 shrink-0">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\.\s+/, ""), i)}</span>
        </div>
      );
      continue;
    }

    if (line.trim() === "") {
      result.push(<div key={`br-${i}`} className="h-1" />);
      continue;
    }

    result.push(<div key={`p-${i}`}>{renderInline(line, i)}</div>);
  }

  if (inCodeBlock) flushCode();

  return result;
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
            <div className="pl-2 border-l-2 border-violet-500/30 ml-1">
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="space-y-0.5 mb-0.5">
                  {msg.toolCalls.map((tc) => (
                    <div key={tc.id} className="flex items-center gap-1.5 text-xs">
                      {tc.status === "running" && msg.isStreaming ? (
                        <Loader2 size={11} className="text-warn-400 animate-spin" />
                      ) : (
                        <Check size={11} className="text-term-400/70" />
                      )}
                      <Wrench size={11} className="text-neutral-700" />
                      <span className="text-neutral-500 font-mono">{tc.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-neutral-200 leading-relaxed">
                {msg.content ? (
                  <MarkdownBlock content={msg.content} />
                ) : (
                  msg.isStreaming && <ThinkingIndicator />
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

function MarkdownBlock({ content }: { content: string }) {
  const rendered = useMemo(() => renderTerminalMarkdown(content), [content]);
  return <div className="space-y-0.5">{rendered}</div>;
}
