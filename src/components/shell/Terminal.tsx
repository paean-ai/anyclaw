import { useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { TerminalOutput } from "./TerminalOutput";
import { TerminalInput } from "./TerminalInput";

interface TerminalProps {
  onCommand: (input: string) => void;
  prompt: string;
  isProcessing: boolean;
}

export function Terminal({ onCommand, prompt, isProcessing }: TerminalProps) {
  const { messages } = useApp();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-4 sm:px-6 py-4",
        "scroll-smooth"
      )}
    >
      <TerminalOutput messages={messages} />
      <div className="mt-2">
        <TerminalInput
          prompt={prompt}
          onSubmit={onCommand}
          disabled={isProcessing}
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
