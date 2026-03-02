/**
 * Install Command
 *
 * Helps users install various claw variants: paeanclaw, zeroclaw, openclaw, nanoclaw.
 * Detects available runtimes and suggests the best install method.
 */
import { execSync } from "child_process";

interface Variant {
  name: string;
  description: string;
  methods: InstallMethod[];
}

interface InstallMethod {
  runtime: string;
  command: string;
  check: () => boolean;
}

const C = "\x1b[36m";
const G = "\x1b[32m";
const Y = "\x1b[33m";
const R = "\x1b[31m";
const B = "\x1b[1m";
const D = "\x1b[0m";

function has(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

const VARIANTS: Record<string, Variant> = {
  paeanclaw: {
    name: "PaeanClaw",
    description: "Ultra-minimal local AI agent runtime (~365 lines). MCP tools, web PWA, Telegram.",
    methods: [
      { runtime: "bun", command: "bun install -g --no-optional paeanclaw", check: () => has("bun") },
      { runtime: "npm", command: "npm install -g paeanclaw", check: () => has("npm") },
    ],
  },
  zeroclaw: {
    name: "ZeroClaw",
    description: "Rust-based AI agent runtime. Extremely low resource usage (<5MB RAM).",
    methods: [
      { runtime: "cargo", command: "cargo install zeroclaw", check: () => has("cargo") },
      { runtime: "npm", command: "npm install -g zeroclaw", check: () => has("npm") },
    ],
  },
  openclaw: {
    name: "OpenClaw",
    description: "Full-featured Python AI agent. 60+ tools, 16+ platforms, voice mode.",
    methods: [
      { runtime: "pip", command: "pip install openclaw", check: () => has("pip") || has("pip3") },
      { runtime: "pipx", command: "pipx install openclaw", check: () => has("pipx") },
    ],
  },
  nanoclaw: {
    name: "NanoClaw",
    description: "Container-isolated AI agent. Docker/Apple Container sandboxing.",
    methods: [
      { runtime: "docker", command: "docker pull nanoclaw/nanoclaw", check: () => has("docker") },
      { runtime: "npm", command: "npm install -g nanoclaw", check: () => has("npm") },
    ],
  },
};

function printVariants(): void {
  console.log(`\n  ${B}Available claw variants:${D}\n`);
  for (const [key, v] of Object.entries(VARIANTS)) {
    const runtimes = v.methods
      .filter((m) => m.check())
      .map((m) => m.runtime);
    const available = runtimes.length > 0
      ? `${G}available${D} (${runtimes.join(", ")})`
      : `${Y}missing runtime${D}`;
    console.log(`  ${C}${key.padEnd(12)}${D} ${v.name} — ${v.description}`);
    console.log(`${"".padEnd(15)}${available}`);
  }
  console.log(`\n  Usage: ${B}anyclaw install <variant>${D}\n`);
}

export async function runInstall(args: string[]): Promise<void> {
  const variant = args[0]?.toLowerCase();

  if (!variant || variant === "--help" || variant === "-h") {
    printVariants();
    return;
  }

  const v = VARIANTS[variant];
  if (!v) {
    console.error(`${R}Unknown variant: ${variant}${D}`);
    printVariants();
    process.exit(1);
  }

  console.log(`\n  ${B}Installing ${v.name}${D}`);
  console.log(`  ${v.description}\n`);

  const method = v.methods.find((m) => m.check());
  if (!method) {
    const needed = v.methods.map((m) => m.runtime).join(" or ");
    console.error(`${R}No compatible runtime found.${D} Install one of: ${needed}`);
    process.exit(1);
  }

  console.log(`  ${C}▸${D} Using ${method.runtime}: ${B}${method.command}${D}\n`);

  const ok = run(method.command);
  if (ok) {
    console.log(`\n  ${G}✓${D} ${v.name} installed successfully.`);
    console.log(`  Run ${C}anyclaw status${D} to verify.\n`);
  } else {
    console.error(`\n  ${R}✗${D} Installation failed. Try running the command manually:`);
    console.error(`    ${method.command}\n`);
    process.exit(1);
  }
}
