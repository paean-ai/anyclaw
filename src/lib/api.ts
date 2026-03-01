import { API_BASE_URL } from "@/config/env";
import type { ClawKeyInfo } from "@/types";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function clawHeaders(clawKey: string): Record<string, string> {
  return { "X-Claw-Key": clawKey };
}

// ---- ClawKey Management ----

export async function createGuestKey(): Promise<ClawKeyInfo> {
  const data = await request<{ success: boolean; clawKey: ClawKeyInfo }>(
    "/claw/key/guest",
    { method: "POST" }
  );
  return data.clawKey;
}

export async function createPersistentKey(
  token: string,
  name?: string
): Promise<ClawKeyInfo> {
  const data = await request<{ success: boolean; clawKey: ClawKeyInfo }>(
    "/claw/key/create",
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ name }),
    }
  );
  return data.clawKey;
}

export async function listKeys(
  token: string
): Promise<ClawKeyInfo[]> {
  const data = await request<{ success: boolean; keys: ClawKeyInfo[] }>(
    "/claw/key/list",
    { headers: authHeaders(token) }
  );
  return data.keys;
}

export async function deleteKey(
  token: string,
  id: number
): Promise<void> {
  await request(`/claw/key/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function regenerateKey(
  token: string,
  id: number
): Promise<ClawKeyInfo> {
  const data = await request<{ success: boolean; clawKey: ClawKeyInfo }>(
    `/claw/key/${id}/regenerate`,
    { method: "POST", headers: authHeaders(token) }
  );
  return data.clawKey;
}

// ---- Claw Channel ----

export async function channelSend(
  clawKey: string,
  message: string
): Promise<string> {
  const data = await request<{
    success: boolean;
    requestId: string;
  }>("/claw/channel/send", {
    method: "POST",
    headers: clawHeaders(clawKey),
    body: JSON.stringify({ message }),
  });
  return data.requestId;
}

export async function channelOnline(clawKey: string): Promise<boolean> {
  const data = await request<{ success: boolean; online: boolean }>(
    "/claw/channel/online",
    { headers: clawHeaders(clawKey) }
  );
  return data.online;
}

export function channelStream(
  clawKey: string,
  requestId: string,
  onEvent: (event: unknown) => void,
  onDone: () => void,
  onError: (err: string) => void
): { abort: () => void } {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/claw/channel/events/${requestId}/stream`,
        {
          headers: { "X-Claw-Key": clawKey },
          signal: controller.signal,
        }
      );

      if (!res.ok || !res.body) {
        onError(`Stream failed: HTTP ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "done") {
              onDone();
              return;
            }
            if (event.type === "error") {
              onError(event.data?.error || "Unknown error");
              return;
            }
            onEvent(event);
          } catch {
            // skip malformed lines
          }
        }
      }
      onDone();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      onError(err instanceof Error ? err.message : "Stream error");
    }
  })();

  return { abort: () => controller.abort() };
}

// ---- Auth ----

export async function loginWithGoogle(
  credential: string
): Promise<{ token: string; user: { id: number; email: string; name: string } }> {
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify({
      idToken: credential,
      domain: window.location.hostname,
    }),
  });
}

export async function loginWithApple(
  authorizationCode: string,
  identityToken: string
): Promise<{ token: string; user: { id: number; email: string; name: string } }> {
  return request("/auth/apple", {
    method: "POST",
    body: JSON.stringify({ authorizationCode, identityToken }),
  });
}
