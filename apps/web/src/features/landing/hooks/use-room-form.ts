"use client";

import type { GameSnapshot, RoomReply } from "@snap-swap/shared";
import { useCallback, useEffect, useState } from "react";
import { getSocketClient, type SnapSwapSocket } from "../../socket";

const connectTimeoutMs = 5_000;

function connectSocket(socket: SnapSwapSocket) {
  if (socket.connected) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Could not connect to the SnapSwap server. Is it running on the configured port?"));
    }, connectTimeoutMs);

    const cleanup = () => {
      window.clearTimeout(timeout);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
    };

    const handleConnect = () => {
      cleanup();
      resolve();
    };

    const handleConnectError = (error: Error) => {
      cleanup();
      reject(error);
    };

    socket.once("connect", handleConnect);
    socket.once("connect_error", handleConnectError);
    socket.connect();
  });
}

export function useRoomForm() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("Enter your name to create a room, or enter a code to join one.");
  const [room, setRoom] = useState<GameSnapshot | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(() => getSocketClient().connected);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const socket = getSocketClient();
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleRoomState = (snapshot: GameSnapshot) => setRoom(snapshot);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room:state", handleRoomState);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room:state", handleRoomState);
    };
  }, []);

  const validateName = useCallback(() => {
    if (playerName.trim()) return playerName.trim();
    setMessage("Add your player name first.");
    return null;
  }, [playerName]);

  const handleRoomReply = useCallback((result: RoomReply, successMessage: string) => {
    if (!result.ok || !result.room || !result.playerId) {
      setMessage(result.message ?? "Something went wrong. Please try again.");
      return;
    }

    setRoom(result.room);
    setPlayerId(result.playerId);
    setRoomCode(result.room.code);
    setMessage(successMessage);
  }, []);

  const emitAction = useCallback(async (action: (socket: SnapSwapSocket, resolve: (result: { ok: boolean; message?: string }) => void) => void, successMessage: string) => {
    const socket = getSocketClient();
    setBusy(true);

    try {
      await connectSocket(socket);
      const result = await new Promise<{ ok: boolean; message?: string }>((resolve) => action(socket, resolve));
      setMessage(result.ok ? successMessage : result.message ?? "Something went wrong. Please try again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not connect to the SnapSwap server.");
    } finally {
      setBusy(false);
    }
  }, []);

  const createRoom = useCallback(async () => {
    const name = validateName();
    if (!name) return;

    const socket = getSocketClient();
    setBusy(true);
    setMessage("Connecting to the SnapSwap server…");

    try {
      await connectSocket(socket);
      const result = await new Promise<RoomReply>((resolve) => {
        socket.emit("room:create", { name }, resolve);
      });
      handleRoomReply(result, `Room ${result.room?.code ?? ""} created. Share the code with another player.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not connect to the SnapSwap server.");
    } finally {
      setBusy(false);
    }
  }, [handleRoomReply, validateName]);

  const joinRoom = useCallback(async () => {
    const name = validateName();
    if (!name) return;

    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) {
      setMessage("Enter the room code you received.");
      return;
    }

    const socket = getSocketClient();
    setBusy(true);
    setMessage("Connecting to the SnapSwap server…");

    try {
      await connectSocket(socket);
      const result = await new Promise<RoomReply>((resolve) => {
        socket.emit("room:join", { code, name }, resolve);
      });
      handleRoomReply(result, `Joined room ${code}. Waiting in the lobby.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not connect to the SnapSwap server.");
    } finally {
      setBusy(false);
    }
  }, [handleRoomReply, roomCode, validateName]);

  const startGame = useCallback(() => {
    void emitAction((socket, resolve) => socket.emit("game:start", resolve), "Tap a market card, then one of your cards — swap toward four of a kind.");
  }, [emitAction]);

  return {
    playerName,
    setPlayerName,
    roomCode,
    setRoomCode,
    message,
    room,
    playerId,
    connected,
    busy,
    createRoom,
    joinRoom,
    startGame,
    setMessage
  };
}
