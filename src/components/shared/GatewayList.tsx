import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { createGuestKey, channelOnline } from "@/lib/api";
import {
  Plus,
  Trash2,
  Key,
  Loader2,
  Check,
  Wifi,
  WifiOff,
  ChevronRight,
} from "lucide-react";
import type { ConnectionState } from "@/types";

const STATUS_COLORS: Record<ConnectionState, string> = {
  connected: "bg-term-400",
  connecting: "bg-warn-400 animate-pulse",
  disconnected: "bg-neutral-600",
  error: "bg-error-400",
};

interface GatewayListProps {
  compact?: boolean;
  onLogin?: () => void;
}

export function GatewayList({ compact, onLogin }: GatewayListProps) {
  const {
    gateways,
    activeGatewayId,
    switchGateway,
    addGateway,
    removeGateway,
    updateGatewayStatus,
  } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [inputName, setInputName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddWithKey = useCallback(() => {
    const trimmed = inputKey.trim();
    if (!trimmed.startsWith("ck_")) {
      setError("Invalid key format. Keys start with ck_");
      return;
    }
    setError(null);
    const gw = addGateway(trimmed, null, inputName.trim() || undefined);
    setInputKey("");
    setInputName("");
    setShowAdd(false);

    channelOnline(trimmed)
      .then((online) => updateGatewayStatus(gw.id, online ? "connected" : "disconnected"))
      .catch(() => updateGatewayStatus(gw.id, "error"));
  }, [inputKey, inputName, addGateway, updateGatewayStatus]);

  const handleAddGuest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await createGuestKey();
      const gw = addGateway(info.key, info, inputName.trim() || undefined);
      setInputName("");
      setShowAdd(false);
      const online = await channelOnline(info.key);
      updateGatewayStatus(gw.id, online ? "connected" : "disconnected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }, [addGateway, updateGatewayStatus, inputName]);

  const handleRemove = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeGateway(id);
    },
    [removeGateway]
  );

  return (
    <div className="flex flex-col gap-1">
      {/* Gateway items */}
      {gateways.map((gw) => {
        const isActive = gw.id === activeGatewayId;
        return (
          <button
            key={gw.id}
            onClick={() => switchGateway(gw.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left group transition-fast",
              isActive
                ? "bg-claw-500/10 border border-claw-500/20"
                : "hover:bg-neutral-800/50 border border-transparent light:hover:bg-neutral-100"
            )}
          >
            {/* Status dot */}
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                STATUS_COLORS[gw.connectionState]
              )}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    isActive
                      ? "text-claw-400"
                      : "text-neutral-300 light:text-neutral-700"
                  )}
                >
                  {gw.name}
                </span>
                {gw.role && (
                  <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-neutral-800/50 text-neutral-500 light:bg-neutral-200 light:text-neutral-500">
                    {gw.role}
                  </span>
                )}
              </div>
              {!compact && (
                <code className="text-[10px] text-neutral-600 light:text-neutral-400 font-mono truncate block">
                  {gw.clawKey.slice(0, 8)}...{gw.clawKey.slice(-4)}
                </code>
              )}
            </div>

            {/* Status icon */}
            <div className="shrink-0 flex items-center gap-1">
              {gw.connectionState === "connected" ? (
                <Wifi size={12} className="text-term-400" />
              ) : gw.connectionState === "connecting" ? (
                <Loader2 size={12} className="text-warn-400 animate-spin" />
              ) : (
                <WifiOff size={12} className="text-neutral-600" />
              )}
              <button
                onClick={(e) => handleRemove(e, gw.id)}
                className={cn(
                  "opacity-0 group-hover:opacity-100 p-0.5 rounded",
                  "text-neutral-600 hover:text-error-400",
                  "transition-fast"
                )}
                title="Remove gateway"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </button>
        );
      })}

      {/* Empty state */}
      {gateways.length === 0 && !showAdd && (
        <div className="text-xs text-neutral-500 px-3 py-4 text-center">
          No gateways configured.
          <br />
          Add one to get started.
        </div>
      )}

      {/* Add gateway form */}
      {showAdd ? (
        <div
          className={cn(
            "mt-1 p-3 rounded-lg space-y-2.5",
            "bg-neutral-800/30 border border-neutral-700/40",
            "light:bg-neutral-50 light:border-neutral-200"
          )}
        >
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Name (optional)"
            className={cn(
              "w-full px-2.5 py-1.5 rounded-md text-xs",
              "bg-neutral-800 border border-neutral-700",
              "text-neutral-200 placeholder:text-neutral-600",
              "light:bg-white light:border-neutral-300",
              "light:text-neutral-900 light:placeholder:text-neutral-400",
              "focus:outline-none focus:border-claw-500/50 transition-fast"
            )}
          />
          <input
            type="text"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Paste ClawKey (ck_...)"
            onKeyDown={(e) => e.key === "Enter" && handleAddWithKey()}
            className={cn(
              "w-full px-2.5 py-1.5 rounded-md text-xs font-mono",
              "bg-neutral-800 border border-neutral-700",
              "text-neutral-200 placeholder:text-neutral-600",
              "light:bg-white light:border-neutral-300",
              "light:text-neutral-900 light:placeholder:text-neutral-400",
              "focus:outline-none focus:border-claw-500/50 transition-fast"
            )}
          />
          {error && <div className="text-[10px] text-error-400">{error}</div>}
          <div className="flex gap-1.5">
            <button
              onClick={handleAddWithKey}
              disabled={!inputKey.trim()}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium",
                "bg-claw-500/20 text-claw-400 border border-claw-500/30",
                "hover:bg-claw-500/30 disabled:opacity-40 transition-fast"
              )}
            >
              <Check size={12} />
              Add
            </button>
            <button
              onClick={handleAddGuest}
              disabled={loading}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium",
                "bg-neutral-800 border border-neutral-700",
                "text-neutral-300 hover:text-neutral-100 hover:border-neutral-600",
                "light:bg-neutral-100 light:border-neutral-300",
                "light:text-neutral-600 light:hover:text-neutral-900",
                "disabled:opacity-40 transition-fast"
              )}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
              Guest
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setError(null);
                setInputKey("");
                setInputName("");
              }}
              className={cn(
                "px-2 py-1.5 rounded-md text-xs",
                "text-neutral-500 hover:text-neutral-300",
                "light:hover:text-neutral-700 transition-fast"
              )}
            >
              Cancel
            </button>
          </div>
          {onLogin && (
            <button
              onClick={onLogin}
              className={cn(
                "w-full flex items-center justify-center gap-1.5",
                "px-2 py-1.5 rounded-md text-xs font-medium",
                "text-claw-400/70 hover:text-claw-400",
                "transition-fast"
              )}
            >
              <ChevronRight size={12} />
              Sign in for persistent keys
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs",
            "border border-dashed",
            "border-neutral-700/50 text-neutral-500",
            "hover:border-neutral-600 hover:text-neutral-400",
            "light:border-neutral-300 light:text-neutral-400",
            "light:hover:border-neutral-400 light:hover:text-neutral-600",
            "transition-fast"
          )}
        >
          <Plus size={13} />
          Add Gateway
        </button>
      )}
    </div>
  );
}
