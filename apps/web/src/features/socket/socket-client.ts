import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@snap-swap/shared";

export type SnapSwapSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: SnapSwapSocket | null = null;

export function getSocketClient() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001", {
      autoConnect: false
    });
  }
  return socket;
}
