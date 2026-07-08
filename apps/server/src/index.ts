import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import {
  addPlayerToRoom,
  createRoom,
  GameEngineError,
  restartGame,
  selectActiveGroup,
  startGame,
  swapCard
} from "@snap-swap/shared";
import type {
  ActionReply,
  ClientToServerEvents,
  GameSnapshot,
  Room,
  RoomReply,
  ServerToClientEvents
} from "@snap-swap/shared";

interface SocketData { roomCode?: string; playerId?: string; }

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.get("/health", (_request, response) => response.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
  cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }
});
const rooms = new Map<string, Room>();

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => codeAlphabet[byte % codeAlphabet.length]).join("");
}
const snapshot = (room: Room): GameSnapshot => ({ ...room, serverTime: Date.now() });
const emitRoom = (room: Room) => io.to(room.code).emit("room:state", snapshot(room));
const messageOf = (error: unknown) => error instanceof GameEngineError || error instanceof Error ? error.message : "Something went wrong";

io.on("connection", (socket) => {
  socket.on("room:create", ({ name }, reply) => {
    try {
      let code = makeCode();
      while (rooms.has(code)) code = makeCode();
      const playerId = randomUUID();
      const room = createRoom({ id: randomUUID(), code, host: { id: playerId, name } });
      rooms.set(code, room);
      socket.data = { roomCode: code, playerId };
      void socket.join(code);
      reply({ ok: true, room: snapshot(room), playerId });
      emitRoom(room);
    } catch (error) {
      reply({ ok: false, message: messageOf(error) });
    }
  });

  socket.on("room:join", ({ code: rawCode, name }, reply) => {
    try {
      const code = rawCode.trim().toUpperCase();
      const existing = rooms.get(code);
      if (!existing) throw new GameEngineError("Room not found. Check the code and try again.");
      const playerId = randomUUID();
      const room = addPlayerToRoom(existing, { id: playerId, name });
      rooms.set(code, room);
      socket.data = { roomCode: code, playerId };
      void socket.join(code);
      reply({ ok: true, room: snapshot(room), playerId });
      emitRoom(room);
    } catch (error) {
      reply({ ok: false, message: messageOf(error) });
    }
  });

  socket.on("room:leave", (reply) => {
    try {
      if (!socket.data.roomCode || !socket.data.playerId) throw new GameEngineError("Join a room first");
      const room = rooms.get(socket.data.roomCode);
      if (!room) throw new GameEngineError("Room not found");

      const next = removePlayerFromRoom(room, socket.data.playerId);
      void socket.leave(room.code);
      socket.data = {};

      if (next) {
        rooms.set(room.code, next);
        emitRoom(next);
      } else {
        rooms.delete(room.code);
      }

      reply({ ok: true });
    } catch (error) {
      reply({ ok: false, message: messageOf(error) });
    }
  });

  socket.on("game:start", (reply) => mutate(socket.data, reply, (room, playerId) => {
    const player = room.players.find((candidate) => candidate.id === playerId);
    if (!player?.isHost) throw new GameEngineError("Only the host can start the game");
    return startGame(room);
  }));

  socket.on("game:select-group", ({ groupIndex }, reply) => mutate(socket.data, reply, (room, playerId) => selectActiveGroup(room, playerId, groupIndex)));

  socket.on("game:swap", (intent, reply) => mutate(socket.data, reply, (room, playerId) => swapCard(room, { ...intent, playerId })));

  socket.on("game:restart", (reply) => mutate(socket.data, reply, (room, playerId) => {
    const player = room.players.find((candidate) => candidate.id === playerId);
    if (!player?.isHost && room.winnerId !== playerId) throw new GameEngineError("Only the host or winner can restart");
    return restartGame(room);
  }));
});

function mutate(data: SocketData, reply: (result: ActionReply) => void, update: (room: Room, playerId: string) => Room) {
  try {
    if (!data.roomCode || !data.playerId) throw new GameEngineError("Join a room first");
    const room = rooms.get(data.roomCode);
    if (!room) throw new GameEngineError("Room not found");
    const next = update(room, data.playerId);
    rooms.set(data.roomCode, next);
    reply({ ok: true });
    emitRoom(next);
  } catch (error) {
    reply({ ok: false, message: messageOf(error) });
  }
}

function removePlayerFromRoom(room: Room, playerId: string): Room | null {
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new GameEngineError("Player not found");

  const remaining = room.players.filter((candidate) => candidate.id !== playerId);
  if (remaining.length === 0) return null;

  const needsHost = player.isHost && !remaining.some((candidate) => candidate.isHost);
  const players = remaining.map((candidate, index) => ({
    ...candidate,
    isHost: needsHost && index === 0 ? true : candidate.isHost
  }));

  return {
    ...room,
    players,
    winnerId: room.winnerId === playerId ? null : room.winnerId,
    feed: [{
      id: `feed:${room.version + 1}`,
      playerId,
      who: player.name,
      text: "left the room",
      color: player.avatarColor,
      kind: "system" as const
    }, ...room.feed].slice(0, 20),
    version: room.version + 1
  };
}

const port = Number(process.env.PORT ?? 3001);
httpServer.listen(port, () => console.log(`Snap Swap server listening on http://localhost:${port}`));
