/**
 * Status Command
 *
 * Checks locally running AI agent gateways by probing common ports
 * and checking for installed claw binaries.
 */
import { execSync } from "child_process";

const C = "\x1b[36m";
const G = "\x1b[32m";
const Y = "\x1b[33m";
const R = "\x1b[31m";
const B = "\x1b[1m";
const D = "\x1b[0m";

interface ProbeTarget {
  name: string;
  port: number;
  type: "claw" | "openai";
  healthPath: string;
}

const TARGETS: ProbeTarget[] = [
  { name: "PaeanClaw", port: 3007, type: "claw", healthPath: "/" },
  { name: "ZeroClaw", port: 42617, type: "claw", healthPath: "/" },
  { name: "OpenAI-compat (LM Studio)", port: 1234, type: "openai", healthPath: "/v1/models" },
  { name: "OpenAI-compat (vLLM)", port: 8080, type: "openai", healthPath: "/v1/models" },
  { name: "Ollama", port: 11434, type: "openai", healthPath: "/v1/models" },
];

function has(cmd: string): string | null {
  try {
    return execSync(`command -v ${cmd}`, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

async function probe(port: number, path: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://localhost:${port}${path}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export async function runStatus(): Promise<void> {
  console.log(`\n  ${B}AnyClaw Status${D}\n`);

  // Check installed binaries
  console.log(`  ${B}Installed:${D}`);
  const bins = [
    { cmd: "paeanclaw", label: "PaeanClaw" },
    { cmd: "zeroclaw", label: "ZeroClaw" },
    { cmd: "openclaw", label: "OpenClaw" },
    { cmd: "nanoclaw", label: "NanoClaw" },
  ];
  let anyInstalled = false;
  for (const b of bins) {
    const location = has(b.cmd);
    if (location) {
      console.log(`    ${G}●${D} ${b.label.padEnd(14)} ${C}${location}${D}`);
      anyInstalled = true;
    }
  }
  if (!anyInstalled) {
    console.log(`    ${Y}(none found)${D}  Run ${C}anyclaw install${D} to get started.`);
  }

  // Probe ports
  console.log(`\n  ${B}Running Gateways:${D}`);
  let anyRunning = false;
  for (const target of TARGETS) {
    const running = await probe(target.port, target.healthPath);
    if (running) {
      console.log(
        `    ${G}●${D} ${target.name.padEnd(28)} ${C}:${target.port}${D}  (${target.type})`
      );
      anyRunning = true;
    }
  }
  if (!anyRunning) {
    console.log(`    ${R}●${D} No running gateways detected.`);
    console.log(`      Start a gateway, e.g.: ${C}paeanclaw${D} or ${C}zeroclaw${D}`);
  }

  console.log("");
}
