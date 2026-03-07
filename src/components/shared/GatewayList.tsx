import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { createGuestKey, createPersistentKey, channelOnline } from "@/lib/api";
import { QrOverlay } from "@/components/shared/QrOverlay";
import {
  Plus,
  Trash2,
  Key,
  Loader2,
  Check,
  Wifi,
  WifiOff,
  ChevronRight,
  Pencil,
  QrCode,
  Copy,
  Eye,
  EyeOff,
  Share2,
  Shield,
  Clock,
} from "lucide-react";
import type { ConnectionState, GatewayProfile } from "@/types";

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

function InlineRenameInput({
  initialName,
  onConfirm,
  onCancel,
}: {
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== initialName) {
      onConfirm(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      value={name}
      onChange={(e) => setName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
        e.stopPropagation();
      }}
      onBlur={commit}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "text-sm font-medium bg-transparent border-b border-claw-500/50",
        "text-claw-400 outline-none w-full min-w-0 py-0 px-0"
      )}
    />
  );
}

function CopyableSnippet({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left group transition-fast",
        "bg-neutral-800/60 border border-neutral-700/50",
        "hover:border-claw-500/30",
        "light:bg-neutral-100 light:border-neutral-200",
        "light:hover:border-claw-500/30"
      )}
    >
      {label && (
        <span className="text-[10px] text-neutral-600 light:text-neutral-400 uppercase shrink-0 w-10">
          {label}
        </span>
      )}
      <code
        className={cn(
          "text-xs font-mono flex-1 min-w-0 truncate",
          "text-neutral-400 group-hover:text-neutral-200",
          "light:text-neutral-600 light:group-hover:text-neutral-800",
          "transition-fast"
        )}
      >
        {text}
      </code>
      {copied ? (
        <Check size={13} className="text-term-400 shrink-0" />
      ) : (
        <Copy
          size={13}
          className={cn(
            "shrink-0 transition-fast",
            "text-neutral-600 group-hover:text-neutral-400",
            "light:text-neutral-400 light:group-hover:text-neutral-600"
          )}
        />
      )}
    </button>
  );
}

function GatewayDetailsPanel({ gateway }: { gateway: GatewayProfile }) {
  const [revealed, setRevealed] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}?claw_key=${encodeURIComponent(gateway.clawKey)}`
      : "";

  const bridgeCmd = `anyclaw bridge -g http://localhost:3007 -k ${gateway.clawKey}`;

  const copyText = useCallback((text: string, what: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWhat(what);
    setTimeout(() => setCopiedWhat(null), 2000);
  }, []);

  return (
    <>
      <div
        className={cn(
          "mt-1 mx-1 px-3 py-3 rounded-lg space-y-2.5",
          "bg-neutral-800/30 border border-neutral-700/30",
          "light:bg-neutral-50 light:border-neutral-200"
        )}
      >
        {/* Key type + status badges */}
        <div className="flex items-center gap-1.5">
          {gateway.keyInfo?.type === "persistent" ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-claw-400 bg-claw-500/10 px-1.5 py-0.5 rounded-full">
              <Shield size={10} /> Persistent
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-warn-400 bg-warn-400/10 px-1.5 py-0.5 rounded-full">
              <Clock size={10} /> Guest · 24h
            </span>
          )}
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              gateway.connectionState === "connected"
                ? "text-term-400 bg-term-400/10"
                : "text-neutral-500 bg-neutral-800 light:bg-neutral-200"
            )}
          >
            {gateway.connectionState === "connected" ? "online" : "offline"}
          </span>
        </div>

        {/* Key display */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-neutral-800/50 border border-neutral-700/50",
            "light:bg-neutral-100 light:border-neutral-200"
          )}
        >
          <Key size={14} className="text-claw-400 shrink-0" />
          <code
            className={cn(
              "text-xs font-mono truncate flex-1 select-all",
              "text-neutral-400 light:text-neutral-600"
            )}
          >
            {revealed
              ? gateway.clawKey
              : `${gateway.clawKey.slice(0, 8)}...${gateway.clawKey.slice(-6)}`}
          </code>
          <button
            onClick={() => setRevealed(!revealed)}
            className="text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-700 transition-fast"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={() => copyText(gateway.clawKey, "key")}
            className="text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-700 transition-fast"
            title="Copy key"
          >
            {copiedWhat === "key" ? (
              <Check size={14} className="text-term-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => copyText(shareUrl, "share")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs",
              "bg-neutral-800/50 border border-neutral-700/40",
              "text-neutral-400 hover:text-neutral-200 hover:border-neutral-600",
              "light:bg-neutral-100 light:border-neutral-200",
              "light:text-neutral-600 light:hover:text-neutral-800",
              "transition-fast"
            )}
          >
            {copiedWhat === "share" ? (
              <Check size={12} className="text-term-400" />
            ) : (
              <Share2 size={12} />
            )}
            <span>Share</span>
          </button>
          <button
            onClick={() => setShowQr(true)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs",
              "bg-neutral-800/50 border border-neutral-700/40",
              "text-neutral-400 hover:text-neutral-200 hover:border-neutral-600",
              "light:bg-neutral-100 light:border-neutral-200",
              "light:text-neutral-600 light:hover:text-neutral-800",
              "transition-fast"
            )}
          >
            <QrCode size={12} />
            <span>QR</span>
          </button>
        </div>

        {/* Bridge command */}
        <div className="space-y-1.5">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              "text-neutral-600 light:text-neutral-400"
            )}
          >
            Bridge Command
          </span>
          <CopyableSnippet text={bridgeCmd} />
        </div>
      </div>

      {showQr && (
        <QrOverlay
          url={shareUrl}
          onClose={() => setShowQr(false)}
          gatewayName={gateway.name}
          clawKey={gateway.clawKey}
          connectionState={gateway.connectionState}
        />
      )}
    </>
  );
}

export function GatewayList({ compact, onLogin }: GatewayListProps) {
  const {
    gateways,
    activeGatewayId,
    switchGateway,
    addGateway,
    removeGateway,
    renameGateway,
    updateGatewayStatus,
    authToken,
  } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [inputName, setInputName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [qrGateway, setQrGateway] = useState<GatewayProfile | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      const info = authToken
        ? await createPersistentKey(authToken, inputName.trim() || "AnyClaw Key")
        : await createGuestKey();
      const gw = addGateway(info.key, info, inputName.trim() || undefined);
      setInputName("");
      setShowAdd(false);
      setExpandedId(gw.id);
      const online = await channelOnline(info.key);
      updateGatewayStatus(gw.id, online ? "connected" : "disconnected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }, [addGateway, updateGatewayStatus, inputName, authToken]);

  const handleRemove = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeGateway(id);
    },
    [removeGateway]
  );

  const handleRename = useCallback(
    (id: string, name: string) => {
      renameGateway(id, name);
      setRenamingId(null);
    },
    [renameGateway]
  );

  return (
    <div className="flex flex-col gap-1">
      {gateways.map((gw) => {
        const isActive = gw.id === activeGatewayId;
        const isRenaming = renamingId === gw.id;
        const isExpanded = expandedId === gw.id;
        return (
          <div key={gw.id}>
            <button
              onClick={() => {
                switchGateway(gw.id);
                setExpandedId(isExpanded ? null : gw.id);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left group transition-fast",
                isActive
                  ? "bg-claw-500/10 border border-claw-500/20"
                  : "hover:bg-neutral-800/50 border border-transparent light:hover:bg-neutral-100"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  STATUS_COLORS[gw.connectionState]
                )}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isRenaming ? (
                    <InlineRenameInput
                      initialName={gw.name}
                      onConfirm={(n) => handleRename(gw.id, n)}
                      onCancel={() => setRenamingId(null)}
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive
                          ? "text-claw-400"
                          : "text-neutral-300 light:text-neutral-700"
                      )}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(gw.id);
                      }}
                      title="Double-click to rename"
                    >
                      {gw.name}
                    </span>
                  )}
                  {gw.role && !isRenaming && (
                    <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-neutral-800/50 text-neutral-500 light:bg-neutral-200 light:text-neutral-500">
                      {gw.role}
                    </span>
                  )}
                </div>
                {!compact && !isRenaming && (
                  <code className="text-[10px] text-neutral-600 light:text-neutral-400 font-mono truncate block">
                    {gw.clawKey.slice(0, 8)}...{gw.clawKey.slice(-4)}
                  </code>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {gw.connectionState === "connected" ? (
                  <Wifi size={12} className="text-term-400" />
                ) : gw.connectionState === "connecting" ? (
                  <Loader2 size={12} className="text-warn-400 animate-spin" />
                ) : (
                  <WifiOff size={12} className="text-neutral-600" />
                )}
                {!isRenaming && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrGateway(gw);
                      }}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-0.5 rounded",
                        "text-neutral-600 hover:text-claw-400",
                        "transition-fast"
                      )}
                      title="Show QR code"
                    >
                      <QrCode size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(gw.id);
                      }}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-0.5 rounded",
                        "text-neutral-600 hover:text-claw-400",
                        "transition-fast"
                      )}
                      title="Rename"
                    >
                      <Pencil size={11} />
                    </button>
                  </>
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
            {isActive && isExpanded && <GatewayDetailsPanel gateway={gw} />}
          </div>
        );
      })}

      {qrGateway && (
        <QrOverlay
          url={`${window.location.origin}?claw_key=${encodeURIComponent(qrGateway.clawKey)}`}
          onClose={() => setQrGateway(null)}
          gatewayName={qrGateway.name}
          clawKey={qrGateway.clawKey}
          connectionState={qrGateway.connectionState}
        />
      )}

      {gateways.length === 0 && !showAdd && (
        <div className="text-center px-3 py-6 space-y-3">
          <div
            className={cn(
              "w-10 h-10 mx-auto rounded-xl flex items-center justify-center",
              "bg-claw-500/10"
            )}
          >
            <Key size={20} className="text-claw-400" />
          </div>
          <div>
            <p className={cn("text-xs font-medium", "text-neutral-300 light:text-neutral-700")}>
              No gateways yet
            </p>
            <p className={cn("text-[11px] mt-1", "text-neutral-500")}>
              Create a key or paste an existing one to connect your local AI agent.
            </p>
          </div>
        </div>
      )}

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
              {authToken ? "Persistent" : "Guest"}
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
