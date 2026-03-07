import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { ChatMessage } from "./ChatMessage";
import { MessageSquare, Terminal, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

function CopyableSnippet({ text, className: extraClass }: { text: string; className?: string }) {
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
        "flex items-center gap-2 px-4 py-2.5 rounded-lg w-full",
        "bg-neutral-800/80 border border-neutral-700/60",
        "light:bg-neutral-100 light:border-neutral-300",
        "hover:border-claw-500/40 hover:bg-neutral-800 light:hover:bg-neutral-200",
        "transition-all group cursor-pointer",
        extraClass
      )}
    >
      <Terminal size={14} className="text-claw-400 shrink-0" />
      <code
        className={cn(
          "text-xs font-mono flex-1 text-left truncate",
          "text-neutral-300 group-hover:text-claw-300",
          "light:text-neutral-600 light:group-hover:text-claw-600"
        )}
      >
        {text}
      </code>
      {copied ? (
        <Check size={14} className="text-green-400 shrink-0" />
      ) : (
        <Copy
          size={14}
          className={cn(
            "shrink-0",
            "text-neutral-600 group-hover:text-neutral-400",
            "light:text-neutral-400 light:group-hover:text-neutral-600"
          )}
        />
      )}
    </button>
  );
}

function SetupSteps({ clawKey }: { clawKey: string | null }) {
  const bridgeCmd = clawKey
    ? `anyclaw bridge -g http://localhost:3007 -k ${clawKey}`
    : "anyclaw bridge -g http://localhost:3007 -k <your-key>";

  const steps = [
    {
      num: 1,
      title: "Start your AI agent",
      desc: "Run paeanclaw, zeroclaw, or any OpenAI-compatible server locally.",
    },
    {
      num: 2,
      title: clawKey ? "Run the bridge" : "Create a key & run the bridge",
      desc: clawKey
        ? "Connect your local agent to the relay with your key:"
        : 'Click "Add Gateway" in the sidebar and create a key, then run:',
      snippet: bridgeCmd,
    },
    {
      num: 3,
      title: "Chat from anywhere",
      desc: "Once connected, type a message below to talk to your agent.",
    },
  ];

  return (
    <div
      className={cn(
        "text-left space-y-3 p-4 rounded-xl max-w-sm mx-auto",
        "bg-neutral-900/50 border border-neutral-800/60",
        "light:bg-neutral-50 light:border-neutral-200"
      )}
    >
      <p className={cn("text-xs font-medium", "text-neutral-300 light:text-neutral-700")}>
        Setup Guide
      </p>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-2.5">
            <span
              className={cn(
                "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                "bg-claw-500/15 text-claw-400"
              )}
            >
              {step.num}
            </span>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className={cn("text-xs font-medium", "text-neutral-300 light:text-neutral-700")}>
                {step.title}
              </p>
              <p className={cn("text-[11px] leading-relaxed", "text-neutral-500 light:text-neutral-500")}>
                {step.desc}
              </p>
              {step.snippet && <CopyableSnippet text={step.snippet} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatView() {
  const { messages, clawKey, connectionState } = useApp();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    const hasKey = !!clawKey;
    const isConnected = connectionState === "connected";

    return (
      <div className="flex-1 flex items-center justify-center overflow-y-auto py-8">
        <div className="text-center space-y-4 px-6 max-w-md">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-claw-500/10 flex items-center justify-center">
            <MessageSquare size={28} className="text-claw-400" />
          </div>

          {!hasKey ? (
            <>
              <div>
                <h3 className={cn("text-base font-semibold", "text-neutral-200 light:text-neutral-800")}>
                  Welcome to AnyClaw
                </h3>
                <p className={cn("text-sm mt-1.5 leading-relaxed", "text-neutral-500 light:text-neutral-500")}>
                  Access your local AI agent from anywhere. Create a gateway key from the sidebar, or use the quick install.
                </p>
              </div>

              <CopyableSnippet text="curl -sL anyclaw.sh | bash" />

              <button
                onClick={() => setShowSetup(!showSetup)}
                className={cn(
                  "flex items-center gap-1.5 mx-auto text-xs transition-colors",
                  "text-claw-400/80 hover:text-claw-400"
                )}
              >
                {showSetup ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showSetup ? "Hide setup guide" : "Show setup guide"}
              </button>

              {showSetup && <SetupSteps clawKey={clawKey} />}
            </>
          ) : !isConnected ? (
            <>
              <div>
                <h3 className={cn("text-base font-semibold", "text-neutral-200 light:text-neutral-800")}>
                  Agent Offline
                </h3>
                <p className={cn("text-sm mt-1.5 leading-relaxed", "text-neutral-500 light:text-neutral-500")}>
                  Your key is ready, but the agent isn&apos;t connected yet. Run the bridge:
                </p>
              </div>
              <CopyableSnippet text={`anyclaw bridge -g http://localhost:3007 -k ${clawKey}`} />
              <p className={cn("text-[11px]", "text-neutral-600 light:text-neutral-400")}>
                Or auto-setup:{" "}
                <code className={cn("px-1.5 py-0.5 rounded font-mono", "bg-neutral-800 light:bg-neutral-200")}>
                  curl -sL anyclaw.sh | bash
                </code>
              </p>
            </>
          ) : (
            <>
              <h3 className={cn("text-sm font-medium", "text-neutral-300 light:text-neutral-700")}>
                Start a conversation
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Your agent is connected. Send a message to get started.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4")}>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
