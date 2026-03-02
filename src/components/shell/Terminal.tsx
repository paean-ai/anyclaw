import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/contexts/AppContext";
import { AsciiLogo } from "./AsciiLogo";
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
  const inputRef = useRef<{ focus: () => void }>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-4 sm:px-6 py-4 cursor-text"
      )}
      onClick={handleClick}
    >
      <AsciiLogo />
      <div className="mt-3" />
      <TerminalOutput messages={messages} />
      <div className="mt-2">
        <TerminalInput
          ref={inputRef}
          prompt={prompt}
          onSubmit={onCommand}
          disabled={isProcessing}
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
