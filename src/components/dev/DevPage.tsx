import { useState, useMemo, useEffect } from "react";
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function DevPage() {
  const { connectionState, messages } = useApp();
  useConnection();
  const { send, cancel } = useChannel();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true);
  }, [isMobile]);

  const isStreaming = useMemo(
    () => messages.some((m) => m.isStreaming),
    [messages]
  );
  const isConnected = connectionState === "connected";

  return (
    <div
      className={cn(
        "fixed inset-0 flex overflow-hidden",
        "bg-neutral-950 dark:bg-neutral-950 light:bg-white",
        "text-neutral-100 dark:text-neutral-100 light:text-neutral-900"
      )}
    >
      {/* Mobile overlay backdrop */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "shrink-0 h-full",
          isMobile && !sidebarCollapsed &&
          "fixed inset-y-0 left-0 z-50 shadow-2xl"
        )}
      >
        <DevSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top bar */}
        <div
          className={cn(
            "flex items-center justify-between px-4 sm:px-6 h-12 shrink-0",
            "border-b",
            "border-neutral-800 dark:border-neutral-800 light:border-neutral-200"
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
        <div className="shrink-0">
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
    </div>
  );
}
