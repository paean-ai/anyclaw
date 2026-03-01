import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { useChannel } from "@/hooks/useChannel";
import { useConnection } from "@/hooks/useConnection";
import { createGuestKey, channelOnline, regenerateKey } from "@/lib/api";
import { TerminalBoot } from "./TerminalBoot";
import { Terminal } from "./Terminal";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { nanoid } from "nanoid";
import { APP_VERSION } from "@/config/env";

const HELP_TEXT = `Available commands:

  connect [key]   Connect using a ClawKey (or paste one directly)
  disconnect      Disconnect from local agent
  guest           Generate a temporary guest key
  refresh         Regenerate current key (persistent keys, requires auth)
  share           Show share URL for cross-device access
  install         Show one-line install command
  status          Show connection status
  key             Show current ClawKey
  clear           Clear terminal
  help            Show this help
  version         Show version

Setup (non-invasive — no changes to your agent):
  1. Start your agent: paeanclaw, zeroclaw, or any OpenAI-compatible server
  2. Run the bridge: anyclaw-bridge -g http://localhost:3007 -k <your-key>
  3. Type "guest" here to get a key, then use it in step 2
  — Or simply run: curl -sL anyclaw.sh | bash

The bridge connects your local agent to this terminal. Zero source changes.`;

const WELCOME_TEXT = `Welcome to AnyClaw — access your local agent from anywhere.

To get started:
  • Type "guest" to generate a temporary ClawKey
  • Type "help" to see all available commands
  • Or paste a ClawKey (ck_...) directly

Quick setup:  curl -sL anyclaw.sh | bash`;

export function ShellPage() {
  const {
    clawKey,
    setClawKey,
    setKeyInfo,
    keyInfo,
    authToken,
    connectionState,
    setConnectionState,
    addMessage,
    clearMessages,
  } = useApp();
  const { send } = useChannel();
  const { checkOnline } = useConnection();
  const [booted, setBooted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const welcomeSentRef = useRef(false);

  const prompt = connectionState === "connected"
    ? "anyclaw@local:~$ "
    : "anyclaw@web:~$ ";

  const systemMsg = useCallback(
    (text: string) => {
      addMessage({
        id: nanoid(8),
        role: "system",
        content: text,
        timestamp: Date.now(),
      });
    },
    [addMessage]
  );

  const handleBootComplete = useCallback(() => {
    setBooted(true);
    // Emit welcome message into the terminal after boot
    if (!welcomeSentRef.current) {
      welcomeSentRef.current = true;
      // Slight delay so terminal mounts first
      setTimeout(() => {
        systemMsg(WELCOME_TEXT);
      }, 100);
    }
  }, [systemMsg]);

  const handleCommand = useCallback(
    async (input: string) => {
      if (processingRef.current) return;

      // Direct ClawKey paste
      if (input.startsWith("ck_")) {
        setClawKey(input);
        setConnectionState("connecting");
        systemMsg(`Key set. Checking agent status...`);
        try {
          const online = await channelOnline(input);
          setConnectionState(online ? "connected" : "disconnected");
          systemMsg(
            online
              ? "✓ Connected to local agent."
              : "Key accepted. Local agent is offline — start openclaw or paeanclaw to connect."
          );
        } catch {
          setConnectionState("error");
          systemMsg("✗ Failed to verify key.");
        }
        return;
      }

      const [cmd, ...args] = input.toLowerCase().split(/\s+/);

      switch (cmd) {
        case "help":
          systemMsg(HELP_TEXT);
          break;

        case "version":
          systemMsg(`AnyClaw v${APP_VERSION}`);
          break;

        case "clear":
          clearMessages();
          break;

        case "guest": {
          systemMsg("Generating guest key...");
          try {
            const info = await createGuestKey();
            setClawKey(info.key);
            setKeyInfo(info);
            systemMsg(`✓ Guest key created: ${info.key}`);
            systemMsg("This key expires in 24 hours. Use 'connect' to link.");
            const online = await channelOnline(info.key);
            setConnectionState(online ? "connected" : "disconnected");
            if (!online) {
              systemMsg(
                "Local agent is offline. Run your agent and bridge to connect."
              );
            } else {
              systemMsg("✓ Connected to local agent. You can now chat.");
            }
          } catch (err) {
            systemMsg(
              `✗ Error: ${err instanceof Error ? err.message : "Failed"}`
            );
          }
          break;
        }

        case "connect": {
          const key = args[0] || clawKey;
          if (!key) {
            systemMsg(
              'No key provided. Use "connect ck_..." or "guest" to get one.'
            );
            break;
          }
          if (!key.startsWith("ck_")) {
            systemMsg("Invalid key format. Keys start with ck_");
            break;
          }
          setClawKey(key);
          setConnectionState("connecting");
          systemMsg("Connecting...");
          try {
            const online = await channelOnline(key);
            setConnectionState(online ? "connected" : "disconnected");
            systemMsg(
              online
                ? "✓ Connected to local agent."
                : "Key accepted. Agent is offline."
            );
          } catch {
            setConnectionState("error");
            systemMsg("✗ Connection error.");
          }
          break;
        }

        case "disconnect":
          setClawKey(null);
          setConnectionState("disconnected");
          systemMsg("Disconnected.");
          break;

        case "status":
          systemMsg(`Connection: ${connectionState}`);
          systemMsg(`Key: ${clawKey ? `${clawKey.slice(0, 8)}...${clawKey.slice(-6)}` : "none"}`);
          if (clawKey) {
            systemMsg(`Key type: ${keyInfo?.type || "unknown"}`);
          }
          await checkOnline();
          break;

        case "key":
          if (clawKey) {
            systemMsg(clawKey);
            systemMsg(`Type: ${keyInfo?.type || "unknown"}`);
          } else {
            systemMsg("No key set. Use 'guest' or 'connect <key>'.");
          }
          break;

        case "refresh":
        case "regenerate": {
          if (!authToken || !keyInfo?.id) {
            systemMsg("Refresh requires sign-in and a persistent key.");
            break;
          }
          systemMsg("Regenerating key...");
          try {
            const updated = await regenerateKey(authToken, keyInfo.id);
            setClawKey(updated.key);
            setKeyInfo(updated);
            systemMsg(`✓ New key: ${updated.key}`);
          } catch (err) {
            systemMsg(`✗ Error: ${err instanceof Error ? err.message : "Failed"}`);
          }
          break;
        }

        case "share": {
          if (!clawKey) {
            systemMsg("No key to share. Use 'guest' first.");
            break;
          }
          const shareUrl = `${window.location.origin}?claw_key=${encodeURIComponent(clawKey)}`;
          systemMsg(`ClawKey: ${clawKey}`);
          systemMsg(`Share URL: ${shareUrl}`);
          systemMsg("Open this URL on another device to connect with the same key.");
          try {
            await navigator.clipboard.writeText(shareUrl);
            systemMsg("(URL copied to clipboard)");
          } catch { /* clipboard may not be available */ }
          break;
        }

        case "install":
          systemMsg(`One-line install:

  curl -sL anyclaw.sh | bash

This installs the bridge, generates a key, and connects automatically.`);
          break;

        default:
          if (connectionState === "connected") {
            processingRef.current = true;
            setProcessing(true);
            await send(input);
            processingRef.current = false;
            setProcessing(false);
          } else {
            systemMsg(
              `Unknown command: ${cmd}. Type "help" for available commands.`
            );
            if (!clawKey) {
              systemMsg(
                'Tip: paste a ClawKey directly, or type "guest" to get one.'
              );
            }
          }
      }
    },
    [
      clawKey,
      connectionState,
      setClawKey,
      setKeyInfo,
      keyInfo,
      authToken,
      setConnectionState,
      addMessage,
      clearMessages,
      send,
      checkOnline,
      systemMsg,
    ]
  );

  return (
    <div
      className={cn(
        "h-screen w-screen flex flex-col",
        "bg-neutral-950 text-neutral-100",
        "relative scanlines"
      )}
    >
      {/* Header bar */}
      <div
        className={cn(
          "flex items-center justify-between px-4 sm:px-6 py-2",
          "border-b border-neutral-800/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-error-400/80" />
            <div className="w-3 h-3 rounded-full bg-warn-400/80" />
            <div className="w-3 h-3 rounded-full bg-term-400/80" />
          </div>
          <span className="font-terminal text-xs text-neutral-500">
            anyclaw.sh
          </span>
        </div>
        <ConnectionStatus state={connectionState} compact />
      </div>

      {/* Terminal body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!booted ? (
          <div className="px-4 sm:px-6 py-6">
            <TerminalBoot onComplete={handleBootComplete} />
          </div>
        ) : (
          <Terminal
            onCommand={handleCommand}
            prompt={prompt}
            isProcessing={processing}
          />
        )}
      </div>

      {/* Footer */}
      <div
        className={cn(
          "flex items-center justify-between px-4 sm:px-6 py-1.5",
          "border-t border-neutral-800/50 text-xs text-neutral-700 font-terminal"
        )}
      >
        <span>HTTPS · E2EE Ready</span>
        <span>v{APP_VERSION}</span>
      </div>
    </div>
  );
}
