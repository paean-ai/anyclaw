import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { detectMode } from "@/config/env";
import { channelOnline } from "@/lib/api";
import {
  getStoredKey,
  setStoredKey,
  removeStoredKey,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getTheme,
  setTheme as persistTheme,
} from "@/lib/storage";
import type {
  AppMode,
  ConnectionState,
  Message,
  ClawKeyInfo,
} from "@/types";

function getUrlClawKey(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("claw_key");
}

interface AppState {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  theme: "dark" | "light";
  setThemeMode: (t: "dark" | "light") => void;
  clawKey: string | null;
  setClawKey: (key: string | null) => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  user: { id: number; email: string; name: string } | null;
  setUser: (u: { id: number; email: string; name: string } | null) => void;
  connectionState: ConnectionState;
  setConnectionState: (s: ConnectionState) => void;
  messages: Message[];
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, update: Partial<Message>) => void;
  clearMessages: () => void;
  keyInfo: ClawKeyInfo | null;
  setKeyInfo: (k: ClawKeyInfo | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>(detectMode);
  const [theme, setThemeState] = useState<"dark" | "light">(getTheme);
  const [clawKey, setClawKeyState] = useState<string | null>(getStoredKey);
  const [authToken, setAuthTokenState] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [keyInfo, setKeyInfo] = useState<ClawKeyInfo | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // Auto-configure from ?claw_key= URL parameter (used by install script)
  useEffect(() => {
    const urlKey = getUrlClawKey();
    if (!urlKey || !urlKey.startsWith("ck_")) return;
    setClawKeyState(urlKey);
    setStoredKey(urlKey);
    setConnectionState("connecting");
    channelOnline(urlKey)
      .then((online) => setConnectionState(online ? "connected" : "disconnected"))
      .catch(() => setConnectionState("disconnected"));
    // Clean URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete("claw_key");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const setThemeMode = useCallback((t: "dark" | "light") => {
    setThemeState(t);
    persistTheme(t);
  }, []);

  const setClawKey = useCallback((key: string | null) => {
    setClawKeyState(key);
    if (key) setStoredKey(key);
    else removeStoredKey();
  }, []);

  const setAuthToken = useCallback((token: string | null) => {
    setAuthTokenState(token);
    if (token) setStoredToken(token);
    else removeStoredToken();
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateMessage = useCallback(
    (id: string, update: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...update } : m))
      );
    },
    []
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        theme,
        setThemeMode,
        clawKey,
        setClawKey,
        authToken,
        setAuthToken,
        user,
        setUser,
        connectionState,
        setConnectionState,
        messages,
        addMessage,
        updateMessage,
        clearMessages,
        keyInfo,
        setKeyInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
