import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";

interface TerminalInputProps {
  prompt: string;
  onSubmit: (input: string) => void;
  disabled?: boolean;
}

export function TerminalInput({
  prompt,
  onSubmit,
  disabled,
}: TerminalInputProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit(value.trim());
      setHistory((prev) => [value.trim(), ...prev]);
      setValue("");
      setHistoryIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(nextIdx);
      if (history[nextIdx]) setValue(history[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = historyIdx - 1;
      if (nextIdx < 0) {
        setHistoryIdx(-1);
        setValue("");
      } else {
        setHistoryIdx(nextIdx);
        setValue(history[nextIdx]);
      }
    }
  };

  return (
    <div
      className="flex items-center gap-0 font-terminal text-sm cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-claw-400 terminal-glow shrink-0 select-none">
        {prompt}
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        className={cn(
          "flex-1 bg-transparent border-none outline-none",
          "text-neutral-100 caret-claw-400 font-terminal text-sm",
          "ml-0 p-0 min-w-0",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {!value && !disabled && (
        <span className="text-neutral-500 cursor-blink select-none">▋</span>
      )}
    </div>
  );
}
