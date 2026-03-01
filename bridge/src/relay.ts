/**
 * Relay Client
 *
 * Communicates with the AnyClaw Service (or zero-api) relay.
 * Polls for incoming messages, claims them, pushes events, completes.
 */
import crypto from "crypto";

export interface RelayConfig {
  serviceUrl: string;
  clawKey: string;
}

export interface PendingRequest {
  requestId: string;
  message: string;
}

const SESSION_ID = crypto.randomBytes(8).toString("hex");

async function relayFetch(
  config: RelayConfig,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${config.serviceUrl.replace(/\/$/, "")}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Claw-Key": config.clawKey,
      ...options.headers,
    },
    ...options,
  });
}

export async function pollRequests(config: RelayConfig): Promise<PendingRequest[]> {
  const res = await relayFetch(config, "/claw/channel/poll", {
    method: "POST",
    body: JSON.stringify({ sessionId: SESSION_ID }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Poll failed: ${(body as Record<string, string>).error || res.status}`);
  }
  const data = (await res.json()) as { requests?: PendingRequest[] };
  return data.requests || [];
}

export async function claimRequest(
  config: RelayConfig,
  requestId: string
): Promise<boolean> {
  const res = await relayFetch(config, `/claw/channel/claim/${requestId}`, {
    method: "POST",
    body: JSON.stringify({ sessionId: SESSION_ID }),
  });
  return res.ok;
}

export async function pushEvents(
  config: RelayConfig,
  requestId: string,
  events: unknown[]
): Promise<void> {
  await relayFetch(config, `/claw/channel/events/${requestId}`, {
    method: "POST",
    body: JSON.stringify({ sessionId: SESSION_ID, events }),
  });
}

export async function completeRequest(
  config: RelayConfig,
  requestId: string,
  result: { content?: string; error?: string }
): Promise<void> {
  await relayFetch(config, `/claw/channel/complete/${requestId}`, {
    method: "POST",
    body: JSON.stringify({ sessionId: SESSION_ID, ...result }),
  });
}
