#!/usr/bin/env node
/**
 * AnyClaw CLI
 *
 * Multi-command toolkit for local AI agent gateways.
 *
 * Usage:
 *   anyclaw                     Show help
 *   anyclaw bridge [options]    Connect local gateway to AnyClaw relay
 *   anyclaw install [variant]   Install a claw variant (paeanclaw, zeroclaw, etc.)
 *   anyclaw status              Check locally running agent gateways
 *   anyclaw version             Show version
 */

const VERSION = "0.2.0";

const BANNER = `
  ▄▀█ █▄░█ █▄█ █▀▀ █░░ ▄▀█ █░█░█
  █▀█ █░▀█ ░█░ █▄▄ █▄▄ █▀█ ▀▄▀▄▀
`;

function printHelp(): void {
  console.log(BANNER);
  console.log(`  AnyClaw CLI v${VERSION}`);
  console.log(`  https://anyclaw.sh\n`);
  console.log(`  Usage:`);
  console.log(`    anyclaw <command> [options]\n`);
  console.log(`  Commands:`);
  console.log(`    bridge    Connect a local AI agent gateway to the AnyClaw relay`);
  console.log(`    install   Install a claw variant (paeanclaw, zeroclaw, openclaw, nanoclaw)`);
  console.log(`    status    Check locally running agent gateways`);
  console.log(`    version   Show version info`);
  console.log(`    help      Show this help message\n`);
  console.log(`  Examples:`);
  console.log(`    anyclaw bridge -g http://localhost:3007 -k ck_g_abc123`);
  console.log(`    anyclaw install paeanclaw`);
  console.log(`    anyclaw status\n`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  // Backward compat: if invoked as `anyclaw-bridge` (old bin name),
  // or if first arg looks like a bridge flag, route to bridge
  const invokedAs = process.argv[1]?.endsWith("anyclaw-bridge") ?? false;
  const bridgeFlags = ["-g", "--gateway", "-k", "--key", "-t", "--type", "-s", "--service"];
  const looksLikeBridge = invokedAs || bridgeFlags.includes(command);

  if (looksLikeBridge) {
    const { runBridge } = await import("./commands/bridge.js");
    return runBridge(looksLikeBridge && !invokedAs ? args : args);
  }

  switch (command) {
    case "bridge": {
      const { runBridge } = await import("./commands/bridge.js");
      return runBridge(args.slice(1));
    }
    case "install": {
      const { runInstall } = await import("./commands/install.js");
      return runInstall(args.slice(1));
    }
    case "status": {
      const { runStatus } = await import("./commands/status.js");
      return runStatus();
    }
    case "version":
    case "--version":
    case "-v":
      console.log(`anyclaw v${VERSION}`);
      break;
    case "help":
    case "--help":
    case "-h":
    default:
      printHelp();
      break;
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
