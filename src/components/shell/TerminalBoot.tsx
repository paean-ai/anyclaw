import { useState, useEffect } from "react";
import { AsciiLogo } from "./AsciiLogo";
import { APP_VERSION } from "@/config/env";

interface BootLine {
  text: string;
  delay: number;
  color?: "cyan" | "green" | "yellow" | "dim" | "default";
  prefix?: string;
}

const BOOT_LINES: BootLine[] = [
  { text: "Initializing secure relay channel...", delay: 100, prefix: "[    ]", color: "dim" },
  { text: "Relay channel initialized", delay: 300, prefix: "[  OK  ]", color: "green" },
  { text: "Non-invasive bridge architecture", delay: 500, prefix: "[  OK  ]", color: "default" },
  { text: `AnyClaw v${APP_VERSION} — E2EE Ready`, delay: 700, prefix: "[  OK  ]", color: "cyan" },
  { text: "", delay: 850 },
  { text: "Quick start:", delay: 1000, color: "default" },
  { text: '  • Type "guest" to get a temporary key', delay: 1100, color: "dim" },
  { text: '  • Type "help" for all available commands', delay: 1200, color: "dim" },
  { text: "  • Paste a ClawKey (ck_...) to connect directly", delay: 1300, color: "dim" },
  { text: "", delay: 1400 },
  { text: "One-line install: curl -sL anyclaw.sh | bash", delay: 1500, color: "cyan" },
  { text: "", delay: 1600 },
];

interface TerminalBootProps {
  onComplete: () => void;
}

const colorClasses: Record<string, string> = {
  cyan: "text-claw-400",
  green: "text-term-400",
  yellow: "text-warn-400",
  dim: "text-neutral-500",
  default: "text-neutral-400",
};

export function TerminalBoot({ onComplete }: TerminalBootProps) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
          if (i === BOOT_LINES.length - 1) {
            setTimeout(onComplete, 300);
          }
        }, line.delay)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="font-terminal text-sm space-y-0.5">
      <AsciiLogo />
      <div className="mt-3 space-y-0">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="animate-fade-in-up leading-relaxed">
            {line.prefix && (
              <span className={line.color === "green" ? "text-term-400" : "text-neutral-600"}>
                {line.prefix}{" "}
              </span>
            )}
            <span className={colorClasses[line.color || "default"]}>
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
