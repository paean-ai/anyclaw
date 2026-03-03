import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import QRCode from "qrcode";
import { Copy, Check, X } from "lucide-react";

interface QrOverlayProps {
  url: string;
  onClose: () => void;
  gatewayName?: string;
  clawKey?: string | null;
  connectionState?: string;
  /** Use terminal font styling (for shell mode) */
  terminal?: boolean;
}

export function QrOverlay({
  url,
  onClose,
  gatewayName,
  clawKey: key,
  connectionState,
  terminal,
}: QrOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<"key" | "url" | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: terminal ? 220 : 200,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [url, terminal]);

  const copyText = (text: string, what: "key" | "url") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const fontCls = terminal ? "font-terminal" : "";

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center", terminal ? "bg-black/80" : "bg-black/70")}
      onClick={onClose}
    >
      <div
        className={cn(
          "border rounded-xl p-6 space-y-3 max-w-xs",
          "bg-neutral-900 border-neutral-700",
          !terminal && "light:bg-white light:border-neutral-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-medium",
              terminal
                ? "text-claw-400 font-terminal"
                : "text-neutral-200 light:text-neutral-800"
            )}
          >
            {terminal ? "scan to connect" : "Scan to connect"}
          </span>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-700"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className={cn(
            "flex justify-center p-4 rounded-lg",
            terminal
              ? "bg-neutral-950 border border-neutral-800/50"
              : "bg-neutral-950 light:bg-neutral-100"
          )}
        >
          <canvas ref={canvasRef} className="rounded" />
        </div>

        {key && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] w-12 shrink-0", fontCls, "text-neutral-600 light:text-neutral-400")}>
                GATEWAY
              </span>
              <span className={cn("text-xs truncate flex-1", fontCls, "text-neutral-300 light:text-neutral-700")}>
                {gatewayName || "—"}
              </span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  fontCls,
                  connectionState === "connected"
                    ? "text-term-400 bg-term-400/10"
                    : "text-neutral-500 bg-neutral-800 light:bg-neutral-200"
                )}
              >
                {connectionState === "connected" ? "online" : "offline"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] w-12 shrink-0", fontCls, "text-neutral-600 light:text-neutral-400")}>
                KEY
              </span>
              <code className={cn("text-xs truncate flex-1 font-mono", fontCls, "text-neutral-400 light:text-neutral-600")}>
                {key.slice(0, 8)}...{key.slice(-6)}
              </code>
              <button
                onClick={() => copyText(key, "key")}
                className="transition-fast shrink-0 text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-700"
                title="Copy key"
              >
                {copied === "key" ? <Check size={13} className="text-term-400" /> : <Copy size={13} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] w-12 shrink-0", fontCls, "text-neutral-600 light:text-neutral-400")}>
                URL
              </span>
              <code className={cn("text-[10px] truncate flex-1 font-mono", fontCls, "text-neutral-500 light:text-neutral-400")}>
                {url.replace(/^https?:\/\//, "").slice(0, 32)}...
              </code>
              <button
                onClick={() => copyText(url, "url")}
                className="transition-fast shrink-0 text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-700"
                title="Copy URL"
              >
                {copied === "url" ? <Check size={13} className="text-term-400" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        )}

        <p className={cn("text-xs text-neutral-500 text-center", fontCls)}>
          Scan from AnyClaw mobile app to add this gateway
        </p>
      </div>
    </div>
  );
}
