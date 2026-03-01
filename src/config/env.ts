import type { AppMode } from "@/types";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4777";

export function detectMode(): AppMode {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("mode");
  if (override === "shell" || override === "dev") return override;

  const hostname = window.location.hostname;
  if (hostname.includes("anyclaw.sh")) return "shell";
  return "dev";
}

export const APP_VERSION = "0.1.0";
