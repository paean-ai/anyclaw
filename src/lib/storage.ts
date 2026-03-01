const STORAGE_PREFIX = "anyclaw_";

export function getStoredKey(): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}claw_key`);
}

export function setStoredKey(key: string): void {
  localStorage.setItem(`${STORAGE_PREFIX}claw_key`, key);
}

export function removeStoredKey(): void {
  localStorage.removeItem(`${STORAGE_PREFIX}claw_key`);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}auth_token`);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(`${STORAGE_PREFIX}auth_token`, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(`${STORAGE_PREFIX}auth_token`);
}

export function getTheme(): "dark" | "light" {
  return (localStorage.getItem(`${STORAGE_PREFIX}theme`) as "dark" | "light") || "dark";
}

export function setTheme(theme: "dark" | "light"): void {
  localStorage.setItem(`${STORAGE_PREFIX}theme`, theme);
}
