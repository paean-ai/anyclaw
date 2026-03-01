import { useState, useEffect } from "react";
import { AsciiLogo } from "./AsciiLogo";

interface BootLine {
  text: string;
  delay: number;
  accent?: boolean;
}

const BOOT_LINES: BootLine[] = [
  { text: "Relay channel initialized", delay: 100 },
  { text: "Non-invasive bridge architecture (v0.1)", delay: 200 },
  { text: 'Type "guest" for a key, "help" for commands, or paste a ClawKey.', delay: 300 },
  { text: "Quick install: curl -sL anyclaw.sh | bash", delay: 400, accent: true },
  { text: "", delay: 500 },
];

interface TerminalBootProps {
  onComplete: () => void;
}

export function TerminalBoot({ onComplete }: TerminalBootProps) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
          if (i === BOOT_LINES.length - 1) {
            setTimeout(onComplete, 200);
          }
        }, line.delay)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="font-terminal text-sm space-y-1">
      <AsciiLogo />
      <div className="mt-3 space-y-0.5">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="animate-fade-in-up">
            {line.text && (
              <span className="text-neutral-500">[  OK  ] </span>
            )}
            <span className={line.accent ? "text-claw-400" : "text-neutral-400"}>
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
