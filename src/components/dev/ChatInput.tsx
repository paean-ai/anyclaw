import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  onCancel,
  isStreaming,
  disabled,
  placeholder = "Message your agent...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(adjustHeight, [value, adjustHeight]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 p-3",
        "bg-neutral-900/80 dark:bg-neutral-900/80 light:bg-white/80",
        "border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200",
        "glass",
        /* safe area for notched devices */
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "flex-1 resize-none px-4 py-2.5 rounded-xl text-sm",
          "bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100",
          "border border-neutral-700 dark:border-neutral-700 light:border-neutral-300",
          "text-neutral-100 dark:text-neutral-100 light:text-neutral-900",
          "placeholder:text-neutral-500 light:placeholder:text-neutral-400",
          "focus:outline-none focus:border-claw-500/50",
          "transition-fast",
          "min-h-[44px] max-h-[160px]"
        )}
      />

      {isStreaming ? (
        <button
          onClick={onCancel}
          className={cn(
            "shrink-0 p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center",
            "bg-error-400/20 text-error-400 border border-error-400/30",
            "hover:bg-error-400/30 transition-fast"
          )}
        >
          <Square size={18} />
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            "shrink-0 p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center",
            "bg-claw-500 text-white",
            "hover:bg-claw-600 disabled:opacity-30 disabled:cursor-not-allowed",
            "transition-fast"
          )}
        >
          <Send size={18} />
        </button>
      )}
    </div>
  );
}
