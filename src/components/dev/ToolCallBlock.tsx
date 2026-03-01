import { cn } from "@/lib/cn";
import { Wrench, Check, Loader2, AlertCircle } from "lucide-react";
import type { ToolCall } from "@/types";

interface ToolCallBlockProps {
  toolCall: ToolCall;
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  const StatusIcon =
    toolCall.status === "running"
      ? Loader2
      : toolCall.status === "completed"
        ? Check
        : toolCall.status === "error"
          ? AlertCircle
          : Loader2;

  const statusColor =
    toolCall.status === "running"
      ? "text-warn-400"
      : toolCall.status === "completed"
        ? "text-term-400"
        : toolCall.status === "error"
          ? "text-error-400"
          : "text-neutral-500";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-neutral-800/50 dark:bg-neutral-800/50 light:bg-neutral-100",
        "border border-neutral-700/50 dark:border-neutral-700/50 light:border-neutral-200",
        "text-xs"
      )}
    >
      <StatusIcon
        size={12}
        className={cn(
          statusColor,
          toolCall.status === "running" && "animate-spin"
        )}
      />
      <Wrench size={12} className="text-neutral-500" />
      <span className="text-neutral-400 font-mono">{toolCall.name}</span>
    </div>
  );
}
