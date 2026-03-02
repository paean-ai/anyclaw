import { cn } from "@/lib/cn";
import { Wrench, Check, Loader2, AlertCircle } from "lucide-react";
import type { ToolCall } from "@/types";

interface ToolCallBlockProps {
  toolCall: ToolCall;
  isStreaming?: boolean;
}

export function ToolCallBlock({ toolCall, isStreaming }: ToolCallBlockProps) {
  const isRunning = toolCall.status === "running" && isStreaming;

  const StatusIcon = isRunning
    ? Loader2
    : toolCall.status === "error"
      ? AlertCircle
      : Check;

  const statusColor = isRunning
    ? "text-warn-400"
    : toolCall.status === "error"
      ? "text-error-400"
      : "text-term-400";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-1 rounded-lg",
        "bg-neutral-800/50 dark:bg-neutral-800/50 light:bg-neutral-100",
        "border border-neutral-700/50 dark:border-neutral-700/50 light:border-neutral-200",
        "text-xs"
      )}
    >
      <StatusIcon
        size={11}
        className={cn(statusColor, isRunning && "animate-spin")}
      />
      <Wrench size={11} className="text-neutral-600" />
      <span className="text-neutral-400 font-mono">{toolCall.name}</span>
    </div>
  );
}
