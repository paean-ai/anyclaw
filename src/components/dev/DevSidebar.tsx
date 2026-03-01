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
} from "lucide-react";

interface DevSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DevSidebar({ collapsed, onToggle }: DevSidebarProps) {
  const { theme, setThemeMode, connectionState, clearMessages } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  if (collapsed) {
    return (
      <>
        <div className="flex flex-col items-center py-3 px-2 gap-3 border-r border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-fast"
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
          "w-64 shrink-0 flex flex-col",
          "border-r border-neutral-800 dark:border-neutral-800 light:border-neutral-200",
          "bg-neutral-900/50 dark:bg-neutral-900/50 light:bg-neutral-50"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
          <Logo size="sm" />
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-fast"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Connection */}
        <div className="px-4 py-3 border-b border-neutral-800/50 dark:border-neutral-800/50 light:border-neutral-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Connection
            </span>
            <ConnectionStatus state={connectionState} compact />
          </div>
          <KeyManager variant="inline" onLogin={() => setShowAuth(true)} />
        </div>

        {/* Actions */}
        <div className="flex-1" />

        {/* Footer controls */}
        <div className="px-4 py-3 border-t border-neutral-800/50 dark:border-neutral-800/50 light:border-neutral-200/50 space-y-1">
          <button
            onClick={clearMessages}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50",
              "transition-fast"
            )}
          >
            <Trash2 size={14} />
            Clear Chat
          </button>
          <button
            onClick={() =>
              setThemeMode(theme === "dark" ? "light" : "dark")
            }
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50",
              "transition-fast"
            )}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            disabled
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              "text-neutral-600 opacity-50 cursor-not-allowed"
            )}
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      </div>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
