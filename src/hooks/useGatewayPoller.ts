import { useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { channelOnline } from "@/lib/api";

const POLL_INTERVAL = 15_000;

export function useGatewayPoller() {
  const { gateways, updateGatewayStatus } = useApp();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (gateways.length === 0) return;

    const pollAll = async () => {
      for (const gw of gateways) {
        if (!gw.clawKey) continue;
        try {
          const online = await channelOnline(gw.clawKey);
          updateGatewayStatus(gw.id, online ? "connected" : "disconnected");
        } catch {
          updateGatewayStatus(gw.id, "error");
        }
      }
    };

    pollAll();
    intervalRef.current = setInterval(pollAll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gateways.length, gateways.map((g) => g.clawKey).join(","), updateGatewayStatus]);
}
