import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { ChatMessage } from "./ChatMessage";
import { MessageSquare, Terminal, Copy, Check } from "lucide-react";

function InstallSnippet() {
  const [copied, setCopied] = useState(false);
  const cmd = "curl -sL anyclaw.sh | bash";
  const copy = useCallback(() => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-lg mt-4 mx-auto",
        "bg-neutral-800/80 border border-neutral-700/60",
        "light:bg-neutral-100 light:border-neutral-300",
        "hover:border-claw-500/40 hover:bg-neutral-800 light:hover:bg-neutral-200",
        "transition-all group cursor-pointer"
      )}
    >
      <Terminal size={14} className="text-claw-400 shrink-0" />
      <code
        className={cn(
          "text-xs font-mono",
          "text-neutral-300 group-hover:text-claw-300",
          "light:text-neutral-600 light:group-hover:text-claw-600"
        )}
      >
        {cmd}
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

export function ChatView() {
  const { messages } = useApp();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 px-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-claw-500/10 flex items-center justify-center">
            <MessageSquare size={24} className="text-claw-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
              Start a conversation
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
              Send a message to your local AI agent. It will be relayed
              through the secure AnyClaw channel.
            </p>
          </div>
          <InstallSnippet />
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
