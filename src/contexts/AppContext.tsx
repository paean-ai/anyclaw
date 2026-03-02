import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { detectMode } from "@/config/env";
import { channelOnline } from "@/lib/api";
import {
  getStoredGateways,
  setStoredGateways,
  getActiveGatewayId,
  setActiveGatewayId as persistActiveId,
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
  GatewayProfile,
} from "@/types";

function getUrlClawKey(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("claw_key");
}

let nextGatewayNum = 1;
function generateGatewayName(gateways: GatewayProfile[]): string {
  const existing = new Set(gateways.map((g) => g.name));
  while (existing.has(`Gateway ${nextGatewayNum}`)) nextGatewayNum++;
  return `Gateway ${nextGatewayNum}`;
}

interface AppState {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  theme: "dark" | "light";
  setThemeMode: (t: "dark" | "light") => void;

  // Multi-gateway
  gateways: GatewayProfile[];
  activeGatewayId: string | null;
  activeGateway: GatewayProfile | null;
  addGateway: (key: string, keyInfo?: ClawKeyInfo | null, name?: string, role?: string) => GatewayProfile;
  removeGateway: (id: string) => void;
  switchGateway: (id: string) => void;
  updateGatewayStatus: (id: string, state: ConnectionState) => void;
  updateGatewayKeyInfo: (id: string, keyInfo: ClawKeyInfo) => void;
  updateGatewayKey: (id: string, key: string, keyInfo?: ClawKeyInfo) => void;
  renameGateway: (id: string, name: string) => void;

  // Derived from activeGateway for backward compatibility
  clawKey: string | null;
  setClawKey: (key: string | null) => void;
  keyInfo: ClawKeyInfo | null;
  setKeyInfo: (k: ClawKeyInfo | null) => void;
  connectionState: ConnectionState;
  setConnectionState: (s: ConnectionState) => void;

  // Auth
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  user: { id: number; email: string; name: string } | null;
  setUser: (u: { id: number; email: string; name: string } | null) => void;

  // Messages
  messages: Message[];
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, update: Partial<Message>) => void;
  clearMessages: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>(detectMode);
  const [theme, setThemeState] = useState<"dark" | "light">(getTheme);
  const [gateways, setGatewaysState] = useState<GatewayProfile[]>(getStoredGateways);
  const [activeGatewayId, setActiveGatewayIdState] = useState<string | null>(() => {
    const stored = getActiveGatewayId();
    const initial = getStoredGateways();
    if (stored && initial.some((g) => g.id === stored)) return stored;
    return initial[0]?.id ?? null;
  });
  const [authToken, setAuthTokenState] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // Persist gateways whenever they change
  useEffect(() => {
    setStoredGateways(gateways);
  }, [gateways]);

  // Auto-configure from ?claw_key= URL parameter
  useEffect(() => {
    const urlKey = getUrlClawKey();
    if (!urlKey || !urlKey.startsWith("ck_")) return;

    setGatewaysState((prev) => {
      const existing = prev.find((g) => g.clawKey === urlKey);
      if (existing) {
        setActiveGatewayIdState(existing.id);
        persistActiveId(existing.id);
        return prev;
      }
      const gw: GatewayProfile = {
        id: `gw-${Date.now()}`,
        name: generateGatewayName(prev),
        clawKey: urlKey,
        keyInfo: null,
        connectionState: "connecting",
        lastSeen: null,
      };
      setActiveGatewayIdState(gw.id);
      persistActiveId(gw.id);
      return [...prev, gw];
    });

    channelOnline(urlKey)
      .then((online) => {
        setGatewaysState((prev) =>
          prev.map((g) =>
            g.clawKey === urlKey
              ? { ...g, connectionState: online ? "connected" : "disconnected" }
              : g
          )
        );
      })
      .catch(() => {
        setGatewaysState((prev) =>
          prev.map((g) =>
            g.clawKey === urlKey ? { ...g, connectionState: "disconnected" } : g
          )
        );
      });

    const url = new URL(window.location.href);
    url.searchParams.delete("claw_key");
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Derived active gateway
  const activeGateway = useMemo(
    () => gateways.find((g) => g.id === activeGatewayId) ?? null,
    [gateways, activeGatewayId]
  );

  const setThemeMode = useCallback((t: "dark" | "light") => {
    setThemeState(t);
    persistTheme(t);
  }, []);

  // Gateway management
  const addGateway = useCallback(
    (key: string, keyInfo?: ClawKeyInfo | null, name?: string, role?: string): GatewayProfile => {
      const gw: GatewayProfile = {
        id: `gw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: name || "",
        clawKey: key,
        keyInfo: keyInfo ?? null,
        connectionState: "disconnected",
        lastSeen: null,
        role,
      };
      setGatewaysState((prev) => {
        if (!gw.name) gw.name = generateGatewayName(prev);
        const next = [...prev, gw];
        return next;
      });
      setActiveGatewayIdState(gw.id);
      persistActiveId(gw.id);
      return gw;
    },
    []
  );

  const removeGateway = useCallback(
    (id: string) => {
      setGatewaysState((prev) => {
        const next = prev.filter((g) => g.id !== id);
        return next;
      });
      setActiveGatewayIdState((current) => {
        if (current === id) {
          const remaining = gateways.filter((g) => g.id !== id);
          const newId = remaining[0]?.id ?? null;
          persistActiveId(newId);
          return newId;
        }
        return current;
      });
    },
    [gateways]
  );

  const switchGateway = useCallback((id: string) => {
    setActiveGatewayIdState(id);
    persistActiveId(id);
  }, []);

  const updateGatewayStatus = useCallback((id: string, state: ConnectionState) => {
    setGatewaysState((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, connectionState: state, lastSeen: state === "connected" ? Date.now() : g.lastSeen }
          : g
      )
    );
  }, []);

  const updateGatewayKeyInfo = useCallback((id: string, keyInfo: ClawKeyInfo) => {
    setGatewaysState((prev) =>
      prev.map((g) => (g.id === id ? { ...g, keyInfo } : g))
    );
  }, []);

  const updateGatewayKey = useCallback((id: string, key: string, keyInfo?: ClawKeyInfo) => {
    setGatewaysState((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, clawKey: key, keyInfo: keyInfo ?? g.keyInfo } : g
      )
    );
  }, []);

  const renameGateway = useCallback((id: string, name: string) => {
    setGatewaysState((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name } : g))
    );
  }, []);

  // Backward-compatible single-key interface (delegates to activeGateway)
  const clawKey = activeGateway?.clawKey ?? null;
  const keyInfo = activeGateway?.keyInfo ?? null;
  const connectionState = activeGateway?.connectionState ?? "disconnected";

  const setClawKey = useCallback(
    (key: string | null) => {
      if (!key) {
        if (activeGatewayId) removeGateway(activeGatewayId);
        return;
      }
      if (activeGateway) {
        updateGatewayKey(activeGateway.id, key);
      } else {
        addGateway(key);
      }
    },
    [activeGateway, activeGatewayId, addGateway, removeGateway, updateGatewayKey]
  );

  const setKeyInfo = useCallback(
    (k: ClawKeyInfo | null) => {
      if (activeGatewayId && k) {
        updateGatewayKeyInfo(activeGatewayId, k);
      }
    },
    [activeGatewayId, updateGatewayKeyInfo]
  );

  const setConnectionState = useCallback(
    (s: ConnectionState) => {
      if (activeGatewayId) {
        updateGatewayStatus(activeGatewayId, s);
      }
    },
    [activeGatewayId, updateGatewayStatus]
  );

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
        gateways,
        activeGatewayId,
        activeGateway,
        addGateway,
        removeGateway,
        switchGateway,
        updateGatewayStatus,
        updateGatewayKeyInfo,
        updateGatewayKey,
        renameGateway,
        clawKey,
        setClawKey,
        keyInfo,
        setKeyInfo,
        connectionState,
        setConnectionState,
        authToken,
        setAuthToken,
        user,
        setUser,
        messages,
        addMessage,
        updateMessage,
        clearMessages,
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
