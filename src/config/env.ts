import type { AppMode } from "@/types";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4777";

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "792190033459-u96tlkcnjc087gfsh3kha3frlrs6omeb.apps.googleusercontent.com";

export const APPLE_CLIENT_ID =
  import.meta.env.VITE_APPLE_CLIENT_ID || "ai.paean.web";

export const APPLE_REDIRECT_URI =
  import.meta.env.VITE_APPLE_REDIRECT_URI ||
  (typeof window !== "undefined"
    ? `${window.location.origin}/api/auth/apple/callback`
    : "https://anyclaw.sh/api/auth/apple/callback");

export function detectMode(): AppMode {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("mode");
  if (override === "shell" || override === "dev") return override;

  const hostname = window.location.hostname;
  if (hostname.includes("anyclaw.sh")) return "shell";
  return "dev";
}

export const APP_VERSION = "0.1.0";
