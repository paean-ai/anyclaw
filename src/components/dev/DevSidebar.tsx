import { useState } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { Logo } from "@/components/shared/Logo";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { KeyManager } from "@/components/shared/KeyManager";
import { AuthModal } from "@/components/shared/AuthModal";
import {
  Settings,
  Moon,
  Sun,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  TerminalSquare,
} from "lucide-react";

interface DevSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DevSidebar({ collapsed, onToggle }: DevSidebarProps) {
  const { theme, setThemeMode, connectionState, clearMessages, setMode } =
    useApp();
  const [showAuth, setShowAuth] = useState(false);

  if (collapsed) {
    return (
      <>
        <div
          className={cn(
            "flex flex-col items-center py-3 gap-3 w-12",
            "border-r",
            "border-neutral-800 dark:border-neutral-800 light:border-neutral-200"
          )}
        >
          <button
            onClick={onToggle}
            className={cn(
              "p-2 rounded-lg transition-fast",
              "text-neutral-500",
              "hover:text-neutral-300 hover:bg-neutral-800/50",
              "light:hover:text-neutral-700 light:hover:bg-neutral-100"
            )}
          >
            <PanelLeft size={18} />
          </button>
          <ConnectionStatus state={connectionState} compact />
        </div>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "w-[260px] shrink-0 flex flex-col h-full",
          "border-r",
          "border-neutral-800 dark:border-neutral-800 light:border-neutral-200",
          "bg-neutral-900/50 dark:bg-neutral-900/50 light:bg-neutral-50/80"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 h-12",
            "border-b",
            "border-neutral-800 dark:border-neutral-800 light:border-neutral-200"
          )}
        >
          <Logo size="sm" />
          <button
            onClick={onToggle}
            className={cn(
              "p-1.5 rounded-lg transition-fast",
              "text-neutral-500",
              "hover:text-neutral-300 hover:bg-neutral-800/50",
              "light:hover:text-neutral-700 light:hover:bg-neutral-100"
            )}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Connection */}
        <div
          className={cn(
            "px-4 py-3",
            "border-b",
            "border-neutral-800/50 dark:border-neutral-800/50 light:border-neutral-200/50"
          )}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              Connection
            </span>
            <ConnectionStatus state={connectionState} compact />
          </div>
          <KeyManager variant="inline" onLogin={() => setShowAuth(true)} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer controls */}
        <div
          className={cn(
            "px-3 py-2.5",
            "border-t",
            "border-neutral-800/50 dark:border-neutral-800/50 light:border-neutral-200/50"
          )}
        >
          <button
            onClick={() => setMode("shell")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
              "text-neutral-500",
              "hover:text-neutral-300 hover:bg-neutral-800/50",
              "light:hover:text-neutral-700 light:hover:bg-neutral-100",
              "transition-fast"
            )}
          >
            <TerminalSquare size={15} />
            <span className="whitespace-nowrap">Terminal Mode</span>
          </button>
          <button
            onClick={clearMessages}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
              "text-neutral-500",
              "hover:text-neutral-300 hover:bg-neutral-800/50",
              "light:hover:text-neutral-700 light:hover:bg-neutral-100",
              "transition-fast"
            )}
          >
            <Trash2 size={15} />
            <span className="whitespace-nowrap">Clear Chat</span>
          </button>
          <button
            onClick={() =>
              setThemeMode(theme === "dark" ? "light" : "dark")
            }
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
              "text-neutral-500",
              "hover:text-neutral-300 hover:bg-neutral-800/50",
              "light:hover:text-neutral-700 light:hover:bg-neutral-100",
              "transition-fast"
            )}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span className="whitespace-nowrap">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
          <button
            disabled
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
              "text-neutral-600 opacity-50 cursor-not-allowed"
            )}
          >
            <Settings size={15} />
            <span className="whitespace-nowrap">Settings</span>
          </button>
        </div>
      </div>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
