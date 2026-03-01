import { APP_VERSION } from "@/config/env";

const LOGO = `
 ▄▀█ █▄░█ █▄█ █▀▀ █░░ ▄▀█ █░█░█
 █▀█ █░▀█ ░█░ █▄▄ █▄▄ █▀█ ▀▄▀▄▀`;

export function AsciiLogo() {
  return (
    <pre className="text-claw-400 terminal-glow text-xs sm:text-sm leading-tight select-none">
      {LOGO}
      {"\n"}
      <span className="text-neutral-600">
        {`  v${APP_VERSION} — Access your local agent from anywhere`}
      </span>
    </pre>
  );
}
