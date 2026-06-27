"use client";

import { useEffect, useState } from "react";
import { getSocketClient } from "./socket-client";

export function useSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocketClient();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: getSocketClient(), connected };
}
