import { useCallback, useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { channelOnline } from "@/lib/api";

export function useConnection() {
  const { clawKey, connectionState, setConnectionState } = useApp();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkOnline = useCallback(async () => {
    if (!clawKey) {
      setConnectionState("disconnected");
      return;
    }
    try {
      const online = await channelOnline(clawKey);
      setConnectionState(online ? "connected" : "disconnected");
    } catch {
      setConnectionState("error");
    }
  }, [clawKey, setConnectionState]);

  const connect = useCallback(async () => {
    if (!clawKey) return;
    setConnectionState("connecting");
    await checkOnline();
  }, [clawKey, setConnectionState, checkOnline]);

  useEffect(() => {
    if (!clawKey) {
      setConnectionState("disconnected");
      return;
    }

    connect();

    intervalRef.current = setInterval(checkOnline, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [clawKey, connect, checkOnline, setConnectionState]);

  const disconnect = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setConnectionState("disconnected");
  }, [setConnectionState]);

  return { connectionState, connect, disconnect, checkOnline };
}
