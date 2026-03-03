/**
 * Bridge Command
 *
 * Connects a local AI agent gateway to the AnyClaw relay service.
 * Polls for incoming messages, forwards them to the local gateway,
 * and streams responses back through the relay.
 */
import { getAdapter } from "../adapters.js";
import {
  pollRequests,
  claimRequest,
  pushEvents,
  completeRequest,
  type RelayConfig,
} from "../relay.js";

interface BridgeConfig {
  gatewayUrl: string;
  gatewayType: string;
  clawKey: string;
  serviceUrl: string;
  name: string;
}

function parseArgs(args: string[]): BridgeConfig {
  const config: BridgeConfig = {
    gatewayUrl: "http://localhost:3007",
    gatewayType: "claw",
    clawKey: "",
    serviceUrl: "https://api.paean.ai",
    name: "",
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--gateway":
      case "-g":
        config.gatewayUrl = args[++i];
        break;
      case "--type":
      case "-t":
        config.gatewayType = args[++i];
        break;
      case "--key":
      case "-k":
        config.clawKey = args[++i];
        break;
      case "--service":
      case "-s":
        config.serviceUrl = args[++i];
        break;
      case "--name":
      case "-n":
        config.name = args[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  config.clawKey = config.clawKey || process.env.CLAW_KEY || "";
  config.serviceUrl =
    config.serviceUrl || process.env.ANYCLAW_SERVICE_URL || "https://api.paean.ai";
  config.gatewayUrl =
    config.gatewayUrl || process.env.GATEWAY_URL || "http://localhost:3007";
  config.name = config.name || process.env.ANYCLAW_BRIDGE_NAME || "";

  return config;
}

function printHelp(): void {
  console.log(`
  AnyClaw Bridge — connects your local AI agent to the AnyClaw relay

  Usage:
    anyclaw bridge --gateway <url> --key <clawkey> [options]

  Options:
    -g, --gateway <url>     Local agent gateway URL (default: http://localhost:3007)
    -t, --type <type>       Gateway type: claw, paeanclaw, zeroclaw, openai (default: claw)
    -k, --key <key>         ClawKey for relay authentication
    -s, --service <url>     AnyClaw service URL (default: https://api.paean.ai)
    -n, --name <name>       Display name for this gateway in the web UI
    -h, --help              Show this help

  Environment:
    CLAW_KEY                ClawKey (alternative to --key)
    ANYCLAW_SERVICE_URL     Service URL (alternative to --service)
    GATEWAY_URL             Gateway URL (alternative to --gateway)
    ANYCLAW_BRIDGE_NAME     Gateway display name (alternative to --name)

  Examples:
    anyclaw bridge -g http://localhost:3007 -k ck_g_abc123
    anyclaw bridge -g http://localhost:3007 -k ck_g_abc123 --name "Primary Agent"
    anyclaw bridge -g http://localhost:42617 -t zeroclaw -k ck_p_xyz789 -n "Monitor"
`);
}

const MIN_POLL_MS = 500;
const MAX_POLL_MS = 5000;
const BACKOFF_FACTOR = 1.5;

let activeConversationId: string | undefined;

async function processRequest(
  relay: RelayConfig,
  gatewayUrl: string,
  gatewayType: string,
  requestId: string,
  message: string
): Promise<void> {
  const claimed = await claimRequest(relay, requestId);
  if (!claimed) {
    console.log(`  [skip] Could not claim ${requestId}`);
    return;
  }

  console.log(
    `  [run]  ${message.slice(0, 60)}${message.length > 60 ? "..." : ""}`
  );

  const adapter = getAdapter(gatewayType);
  const eventBatch: unknown[] = [];

  const flush = async () => {
    if (eventBatch.length === 0) return;
    const batch = eventBatch.splice(0);
    await pushEvents(relay, requestId, batch);
  };

  try {
    const result = await adapter.send(
      gatewayUrl,
      message,
      (event) => {
        eventBatch.push(event);
        if (
          eventBatch.length >= 5 ||
          event.type === "tool_call" ||
          event.type === "tool_result"
        ) {
          flush();
        }
      },
      undefined,
      activeConversationId
    );
    if (result.conversationId) activeConversationId = result.conversationId;
    await flush();
    await completeRequest(relay, requestId, { content: result.content });
    console.log(`  [done] ${requestId}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`  [err]  ${requestId}: ${errorMsg}`);
    await flush();
    await completeRequest(relay, requestId, { error: errorMsg });
  }
}

export async function runBridge(args: string[]): Promise<void> {
  const config = parseArgs(args);

  if (!config.clawKey) {
    console.error(
      "Error: ClawKey is required. Use --key or set CLAW_KEY env var."
    );
    console.error("Run with --help for usage.");
    process.exit(1);
  }

  console.log(`\n  ▄▀█ █▄░█ █▄█ █▀▀ █░░ ▄▀█ █░█░█`);
  console.log(`  █▀█ █░▀█ ░█░ █▄▄ █▄▄ █▀█ ▀▄▀▄▀`);
  console.log(`\n  AnyClaw Bridge v0.2.3`);
  if (config.name) console.log(`  Name:     ${config.name}`);
  console.log(`  Gateway:  ${config.gatewayUrl} (${config.gatewayType})`);
  console.log(`  Service:  ${config.serviceUrl}`);
  console.log(`  Key:      ${config.clawKey.slice(0, 8)}...`);
  console.log(
    `\n  Waiting for messages from anyclaw.sh / anyclaw.dev ...\n`
  );

  const relay: RelayConfig = {
    serviceUrl: config.serviceUrl,
    clawKey: config.clawKey,
  };

  let pollInterval = MIN_POLL_MS;
  let running = true;

  process.on("SIGINT", () => {
    console.log("\n  Bridge stopped.");
    running = false;
    process.exit(0);
  });

  while (running) {
    try {
      const pending = await pollRequests(relay);
      if (pending.length > 0) {
        pollInterval = MIN_POLL_MS;
        for (const req of pending) {
          await processRequest(
            relay,
            config.gatewayUrl,
            config.gatewayType,
            req.requestId,
            req.message
          );
        }
      } else {
        pollInterval = Math.min(
          pollInterval * BACKOFF_FACTOR,
          MAX_POLL_MS
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("ECONNREFUSED")) {
        console.error(`  [poll] ${msg}`);
      }
      pollInterval = MAX_POLL_MS;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}
