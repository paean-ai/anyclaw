import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { useChannel } from "@/hooks/useChannel";
import { useConnection } from "@/hooks/useConnection";
import { DevSidebar } from "./DevSidebar";
import { ChatView } from "./ChatView";
import { ChatInput } from "./ChatInput";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { Logo } from "@/components/shared/Logo";
import { APP_VERSION } from "@/config/env";

export function DevPage() {
  const { connectionState, messages } = useApp();
  useConnection();
  const { send, cancel } = useChannel();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isStreaming = useMemo(
    () => messages.some((m) => m.isStreaming),
    [messages]
  );
  const isConnected = connectionState === "connected";

  return (
    <div
      className={cn(
        "h-screen w-screen flex",
        "bg-neutral-950 dark:bg-neutral-950 light:bg-white",
        "text-neutral-100 dark:text-neutral-100 light:text-neutral-900"
      )}
    >
      {/* Sidebar */}
      <DevSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className={cn(
            "flex items-center justify-between px-4 sm:px-6 py-2.5",
            "border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200"
          )}
        >
          <div className="flex items-center gap-3">
            {sidebarCollapsed && <Logo size="sm" />}
            <ConnectionStatus state={connectionState} />
          </div>
          <span className="text-xs text-neutral-600 font-mono">
            v{APP_VERSION}
          </span>
        </div>

        {/* Chat area */}
        <ChatView />

        {/* Input */}
        <ChatInput
          onSubmit={send}
          onCancel={cancel}
          isStreaming={isStreaming}
          disabled={!isConnected}
          placeholder={
            isConnected
              ? "Message your agent..."
              : "Connect a ClawKey to start chatting"
          }
        />
      </div>
    </div>
  );
}
