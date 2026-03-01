import { cn } from "@/lib/cn";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import type { ConnectionState } from "@/types";

interface ConnectionStatusProps {
  state: ConnectionState;
  className?: string;
  compact?: boolean;
}

const config: Record<ConnectionState, { color: string; label: string }> = {
  disconnected: { color: "text-neutral-500", label: "Offline" },
  connecting: { color: "text-warn-400", label: "Connecting..." },
  connected: { color: "text-term-400", label: "Connected" },
  error: { color: "text-error-400", label: "Error" },
};

export function ConnectionStatus({
  state,
  className,
  compact,
}: ConnectionStatusProps) {
  const { color, label } = config[state];
  const Icon =
    state === "connecting"
      ? Loader2
      : state === "connected"
        ? Wifi
        : WifiOff;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative">
        {state === "connected" && (
          <span
            className={cn(
              "absolute inset-0 rounded-full bg-term-400/30 pulse-dot"
            )}
          />
        )}
        <Icon
          size={compact ? 14 : 16}
          className={cn(
            color,
            state === "connecting" && "animate-spin"
          )}
        />
      </div>
      {!compact && (
        <span className={cn("text-xs font-medium", color)}>{label}</span>
      )}
    </div>
  );
}
