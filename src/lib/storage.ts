import type { GatewayProfile } from "@/types";

const STORAGE_PREFIX = "anyclaw_";

// ---- Legacy single-key (kept for migration) ----

export function getStoredKey(): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}claw_key`);
}

export function setStoredKey(key: string): void {
  localStorage.setItem(`${STORAGE_PREFIX}claw_key`, key);
}

export function removeStoredKey(): void {
  localStorage.removeItem(`${STORAGE_PREFIX}claw_key`);
}

// ---- Auth ----

export function getStoredToken(): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}auth_token`);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(`${STORAGE_PREFIX}auth_token`, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(`${STORAGE_PREFIX}auth_token`);
}

// ---- User ----

export function getStoredUser(): { id: number; email: string; name: string } | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}user`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: { id: number; email: string; name: string }): void {
  localStorage.setItem(`${STORAGE_PREFIX}user`, JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem(`${STORAGE_PREFIX}user`);
}

// ---- Theme ----

export function getTheme(): "dark" | "light" {
  return (localStorage.getItem(`${STORAGE_PREFIX}theme`) as "dark" | "light") || "dark";
}

export function setTheme(theme: "dark" | "light"): void {
  localStorage.setItem(`${STORAGE_PREFIX}theme`, theme);
}

// ---- Multi-Gateway Profiles ----

export function getStoredGateways(): GatewayProfile[] {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}gateways`);
  if (raw) {
    try {
      return JSON.parse(raw) as GatewayProfile[];
    } catch {
      return [];
    }
  }

  // Migrate from legacy single-key storage
  const legacyKey = getStoredKey();
  if (legacyKey) {
    const migrated: GatewayProfile = {
      id: "migrated-1",
      name: "Default",
      clawKey: legacyKey,
      keyInfo: null,
      connectionState: "disconnected",
      lastSeen: null,
    };
    setStoredGateways([migrated]);
    removeStoredKey();
    return [migrated];
  }

  return [];
}

export function setStoredGateways(gateways: GatewayProfile[]): void {
  const serializable = gateways.map((gw) => ({
    ...gw,
    connectionState: "disconnected" as const,
  }));
  localStorage.setItem(`${STORAGE_PREFIX}gateways`, JSON.stringify(serializable));
}

export function getActiveGatewayId(): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}active_gateway`);
}

export function setActiveGatewayId(id: string | null): void {
  if (id) {
    localStorage.setItem(`${STORAGE_PREFIX}active_gateway`, id);
  } else {
    localStorage.removeItem(`${STORAGE_PREFIX}active_gateway`);
  }
}
