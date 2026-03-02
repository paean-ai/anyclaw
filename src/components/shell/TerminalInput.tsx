import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface TerminalInputProps {
  prompt: string;
  onSubmit: (input: string) => void;
  disabled?: boolean;
}

export const TerminalInput = forwardRef<
  { focus: () => void },
  TerminalInputProps
>(function TerminalInput({ prompt, onSubmit, disabled }, ref) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [cursorLeft, setCursorLeft] = useState(0);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  useEffect(() => {
    if (measureRef.current) {
      setCursorLeft(measureRef.current.offsetWidth);
    }
  }, [value]);

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
      className="flex items-center gap-0 font-terminal text-sm"
      onClick={(e) => {
        e.stopPropagation();
        inputRef.current?.focus();
      }}
    >
      <span className="text-claw-400 terminal-glow shrink-0 select-none">
        {prompt}
      </span>
      <span className="relative flex-1 min-w-0">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            "w-full bg-transparent border-none outline-none",
            "text-neutral-100 font-terminal text-sm",
            "caret-transparent",
            "p-0 min-w-0",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {/* Hidden span to measure actual text width including CJK chars */}
        <span
          ref={measureRef}
          className="absolute top-0 left-0 invisible whitespace-pre font-terminal text-sm pointer-events-none"
          aria-hidden="true"
        >
          {value}
        </span>
        {!disabled && (
          <span
            className="absolute top-0 pointer-events-none text-claw-400 cursor-blink font-terminal text-sm select-none"
            style={{ left: `${cursorLeft}px` }}
          >
            ▋
          </span>
        )}
      </span>
    </div>
  );
});
