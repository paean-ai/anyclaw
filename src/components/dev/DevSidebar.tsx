import { useState } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { useGatewayPoller } from "@/hooks/useGatewayPoller";
import { Logo } from "@/components/shared/Logo";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { GatewayList } from "@/components/shared/GatewayList";
import { AuthModal } from "@/components/shared/AuthModal";
import {
  Moon,
  Sun,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  TerminalSquare,
  LogIn,
  LogOut,
} from "lucide-react";

interface DevSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DevSidebar({ collapsed, onToggle }: DevSidebarProps) {
  const { theme, setThemeMode, connectionState, clearMessages, setMode } =
    useApp();
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  useGatewayPoller();

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
          {isAuthenticated ? (
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center",
                "bg-claw-500/20 text-claw-400 text-xs font-bold"
              )}
              title={user?.name || user?.email || "Signed In"}
            >
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="text-neutral-600 hover:text-claw-400 transition-fast"
              title="Sign In"
            >
              <LogIn size={16} />
            </button>
          )}
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

        {/* Gateways */}
        <div
          className={cn(
            "px-3 py-3 flex-1 overflow-y-auto",
            "border-b",
            "border-neutral-800/50 dark:border-neutral-800/50 light:border-neutral-200/50"
          )}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              Gateways
            </span>
            <ConnectionStatus state={connectionState} compact />
          </div>
          <GatewayList onLogin={() => setShowAuth(true)} />
        </div>

        {/* User section */}
        <div
          className={cn(
            "px-3 py-2.5",
            "border-b",
            "border-neutral-800/50 dark:border-neutral-800/50 light:border-neutral-200/50"
          )}
        >
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  "bg-claw-500/20 text-claw-400 text-sm font-bold"
                )}
              >
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-200 light:text-neutral-800 truncate">
                  {user?.name || "User"}
                </div>
                <div className="text-[10px] text-neutral-500 truncate">
                  {user?.email || ""}
                </div>
              </div>
              <button
                onClick={logout}
                className={cn(
                  "p-1.5 rounded-lg transition-fast shrink-0",
                  "text-neutral-500",
                  "hover:text-error-400 hover:bg-neutral-800/50",
                  "light:hover:bg-neutral-100"
                )}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
                "text-claw-400/70",
                "hover:text-claw-400 hover:bg-claw-500/10",
                "transition-fast"
              )}
            >
              <LogIn size={15} />
              <span className="whitespace-nowrap">Sign In</span>
            </button>
          )}
        </div>

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
        </div>
      </div>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

