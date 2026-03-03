import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { createGuestKey, regenerateKey } from "@/lib/api";
import { QrOverlay } from "@/components/shared/QrOverlay";
import {
  Key,
  Copy,
  Check,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Share2,
  QrCode,
  Shield,
  Clock,
} from "lucide-react";

interface KeyManagerProps {
  variant?: "inline" | "modal";
  onLogin?: () => void;
}

function getShareUrl(key: string): string {
  const base = window.location.origin;
  return `${base}?claw_key=${encodeURIComponent(key)}`;
}

export function KeyManager({ variant = "inline", onLogin }: KeyManagerProps) {
  const { clawKey, setClawKey, setKeyInfo, keyInfo, authToken, activeGateway } = useApp();
  const [inputKey, setInputKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"key" | "url" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const generateGuest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await createGuestKey();
      setClawKey(info.key);
      setKeyInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }, [setClawKey, setKeyInfo]);

  const connectWithKey = useCallback(() => {
    const trimmed = inputKey.trim();
    if (!trimmed.startsWith("ck_")) {
      setError("Invalid key format. Keys start with ck_");
      return;
    }
    setError(null);
    setClawKey(trimmed);
  }, [inputKey, setClawKey]);

  const copyKey = useCallback(() => {
    if (!clawKey) return;
    navigator.clipboard.writeText(clawKey);
    setCopied("key");
    setTimeout(() => setCopied(null), 2000);
  }, [clawKey]);

  const copyShareUrl = useCallback(() => {
    if (!clawKey) return;
    navigator.clipboard.writeText(getShareUrl(clawKey));
    setCopied("url");
    setTimeout(() => setCopied(null), 2000);
  }, [clawKey]);

  const handleRefresh = useCallback(async () => {
    if (!authToken || !keyInfo?.id) return;
    setRefreshing(true);
    try {
      const updated = await regenerateKey(authToken, keyInfo.id);
      setClawKey(updated.key);
      setKeyInfo(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh key");
    } finally {
      setRefreshing(false);
    }
  }, [authToken, keyInfo, setClawKey, setKeyInfo]);

  if (clawKey) {
    return (
      <>
        <div
          className={cn(
            "flex flex-col gap-2.5",
            variant === "modal" && "w-full"
          )}
        >
          {/* Key type badge */}
          <div className="flex items-center gap-1.5">
            {keyInfo?.type === "persistent" ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-claw-400 bg-claw-500/10 px-1.5 py-0.5 rounded-full">
                <Shield size={10} />
                Persistent
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-warn-400 bg-warn-400/10 px-1.5 py-0.5 rounded-full">
                <Clock size={10} />
                Guest · 24h
              </span>
            )}
          </div>

          {/* Key display row */}
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
              {revealed ? clawKey : `${clawKey.slice(0, 8)}...${clawKey.slice(-6)}`}
            </code>
            <button
              onClick={() => setRevealed(!revealed)}
              className={cn(
                "transition-fast",
                "text-neutral-500 hover:text-neutral-300",
                "light:hover:text-neutral-700"
              )}
              title={revealed ? "Hide key" : "Reveal key"}
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={copyKey}
              className={cn(
                "transition-fast",
                "text-neutral-500 hover:text-neutral-300",
                "light:hover:text-neutral-700"
              )}
              title="Copy key"
            >
              {copied === "key" ? <Check size={14} className="text-term-400" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={copyShareUrl}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs",
                "bg-neutral-800/50 border border-neutral-700/40",
                "text-neutral-400 hover:text-neutral-200 hover:border-neutral-600",
                "light:bg-neutral-100 light:border-neutral-200",
                "light:text-neutral-600 light:hover:text-neutral-800 light:hover:border-neutral-300",
                "transition-fast"
              )}
              title="Copy share URL"
            >
              {copied === "url" ? <Check size={12} className="text-term-400" /> : <Share2 size={12} />}
              <span>Share</span>
            </button>
            <button
              onClick={() => setShowQr(true)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs",
                "bg-neutral-800/50 border border-neutral-700/40",
                "text-neutral-400 hover:text-neutral-200 hover:border-neutral-600",
                "light:bg-neutral-100 light:border-neutral-200",
                "light:text-neutral-600 light:hover:text-neutral-800 light:hover:border-neutral-300",
                "transition-fast"
              )}
              title="Show QR code"
            >
              <QrCode size={12} />
              <span>QR</span>
            </button>
            {authToken && keyInfo?.type === "persistent" && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs",
                  "bg-neutral-800/50 border border-neutral-700/40",
                  "text-neutral-400 hover:text-neutral-200 hover:border-neutral-600",
                  "light:bg-neutral-100 light:border-neutral-200",
                  "light:text-neutral-600 light:hover:text-neutral-800 light:hover:border-neutral-300",
                  "disabled:opacity-40 transition-fast"
                )}
                title="Regenerate key"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            )}
          </div>

          {error && <div className="text-xs text-error-400 px-1">{error}</div>}
        </div>

        {showQr && (
          <QrOverlay
            url={getShareUrl(clawKey)}
            onClose={() => setShowQr(false)}
            gatewayName={activeGateway?.name}
            clawKey={clawKey}
            connectionState={activeGateway?.connectionState}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        variant === "modal" && "w-full max-w-sm"
      )}
    >
      {error && (
        <div className="text-xs text-error-400 px-1">{error}</div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="Paste your ClawKey (ck_...)"
          onKeyDown={(e) => e.key === "Enter" && connectWithKey()}
          className={cn(
            "flex-1 min-w-0 px-3 py-2 rounded-lg text-sm font-mono",
            "bg-neutral-800 border border-neutral-700",
            "text-neutral-100 placeholder:text-neutral-600",
            "light:bg-white light:border-neutral-300",
            "light:text-neutral-900 light:placeholder:text-neutral-400",
            "focus:outline-none focus:border-claw-500/50",
            "transition-fast"
          )}
        />
        <button
          onClick={connectWithKey}
          disabled={!inputKey.trim()}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium shrink-0",
            "bg-claw-500/20 text-claw-400 border border-claw-500/30",
            "hover:bg-claw-500/30 disabled:opacity-40",
            "light:bg-claw-500/10 light:border-claw-500/20",
            "transition-fast"
          )}
        >
          Connect
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-800 light:bg-neutral-200" />
        <span className="text-xs text-neutral-600 light:text-neutral-400">or</span>
        <div className="h-px flex-1 bg-neutral-800 light:bg-neutral-200" />
      </div>

      <div className="flex gap-2">
        <button
          onClick={generateGuest}
          disabled={loading}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5",
            "px-2 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap",
            "bg-neutral-800 border border-neutral-700",
            "text-neutral-300 hover:text-neutral-100 hover:border-neutral-600",
            "light:bg-neutral-100 light:border-neutral-300",
            "light:text-neutral-600 light:hover:text-neutral-900 light:hover:border-neutral-400",
            "disabled:opacity-50 transition-fast"
          )}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Key size={14} className="shrink-0" />
          )}
          Guest
        </button>

        {onLogin && (
          <button
            onClick={onLogin}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5",
              "px-2 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap",
              "bg-claw-500/10 border border-claw-500/20",
              "text-claw-400 hover:bg-claw-500/20",
              "transition-fast"
            )}
          >
            <LogIn size={14} className="shrink-0" />
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
