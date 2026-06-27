import { describe, expect, it } from "vitest";
import {
  addPlayerToRoom,
  checkCompletedGroups,
  checkWinner,
  createDeck,
  createRoom,
  dealCards,
  FASHION_PACK,
  GameEngineError,
  restartGame,
  startGame,
  swapCard
} from "./index.js";
import type { Card, Player, Room } from "./types.js";

const host = { id: "p1", name: "Mia" };
const roomWithTwo = () => addPlayerToRoom(createRoom({ id: "r1", code: "glow42", host }), { id: "p2", name: "Leo" });
const seeded = () => {
  let value = 42;
  return () => ((value = (value * 1664525 + 1013904223) % 4294967296) / 4294967296);
};

describe("game engine", () => {
  it("generates every pack combination with four copies", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(144);
    expect(new Set(deck.map((card) => card.id))).toHaveLength(144);
    expect(deck.filter((card) => card.groupKey === "peach" && card.itemKey === "dress")).toHaveLength(4);
  });

  it("creates a normalized lobby room with a host", () => {
    const room = createRoom({ id: "r1", code: " glow42 ", host });
    expect(room.code).toBe("GLOW42");
    expect(room.status).toBe("lobby");
    expect(room.players[0]).toMatchObject({ id: "p1", isHost: true });
  });

  it("adds a player without mutating the room", () => {
    const room = createRoom({ id: "r1", code: "GLOW42", host });
    const joined = addPlayerToRoom(room, { id: "p2", name: "Leo" });
    expect(room.players).toHaveLength(1);
    expect(joined.players).toHaveLength(2);
    expect(joined.players[1]?.isHost).toBe(false);
  });

  it("starts a game and deals hands and market cards", () => {
    const started = startGame(roomWithTwo(), seeded(), 1000);
    expect(started.status).toBe("playing");
    expect(started.startedAt).toBe(1000);
    expect(started.players.every((player) => player.groups.length === 3)).toBe(true);
    expect(started.players.every((player) => player.groups.every((group) => group.slots.length === 4))).toBe(true);
    expect(started.market).toHaveLength(6);
  });

  it("deals cards from the supplied deck predictably", () => {
    const room = roomWithTwo();
    const deck = createDeck();
    const dealt = dealCards(room, deck);
    expect(dealt.players[0]?.groups[0]?.slots[0]?.id).toBe(deck[0]?.id);
    expect(dealt.market[0]?.id).toBe(deck[24]?.id);
  });

  it("performs a valid one-for-one swap", () => {
    const started = startGame(roomWithTwo(), seeded());
    const handBefore = started.players[0]!.groups[0]!.slots[0]!;
    const marketBefore = started.market[0]!;
    const swapped = swapCard(started, { playerId: "p1", groupIndex: 0, slotIndex: 0, marketIndex: 0 });
    expect(swapped.players[0]!.groups[0]!.slots[0]?.id).toBe(marketBefore.id);
    expect(swapped.market[0]?.id).toBe(handBefore.id);
    expect(started.market[0]?.id).toBe(marketBefore.id);
  });

  it("rejects a swap when the center card is unavailable", () => {
    const started = startGame(roomWithTwo(), seeded());
    const unavailable: Room = { ...started, market: [null, ...started.market.slice(1)] };
    expect(() => swapCard(unavailable, { playerId: "p1", groupIndex: 0, slotIndex: 0, marketIndex: 0 }))
      .toThrowError(new GameEngineError("Center card is unavailable"));
  });

  it("detects completed groups from any four matching cards", () => {
    const targetCard: Card = createDeck().find((card) => card.groupKey === "peach" && card.itemKey === "dress")!;
    const differentTarget: Card = createDeck().find((card) => card.groupKey === "sky" && card.itemKey === "bag")!;
    const player: Player = {
      id: "p1", name: "Mia", avatarColor: "#fff", isHost: true, activeGroup: 0,
      groups: [{ target: differentTarget, slots: [targetCard, targetCard, targetCard, targetCard], complete: false }]
    };
    expect(checkCompletedGroups(player)).toEqual([true]);
  });

  it("detects a winner with every group complete", () => {
    const base = startGame(roomWithTwo(), seeded());
    const card = createDeck()[0]!;
    const winner = {
      ...base.players[0]!,
      groups: Array.from({ length: 3 }, () => ({ target: card, slots: [card, card, card, card], complete: true }))
    };
    expect(checkWinner({ ...base, players: [winner, base.players[1]!] })?.id).toBe("p1");
  });

  it("restarts into a clean lobby while preserving players", () => {
    const restarted = restartGame(startGame(roomWithTwo(), seeded()));
    expect(restarted.status).toBe("lobby");
    expect(restarted.players).toHaveLength(2);
    expect(restarted.players.every((player) => player.groups.length === 0)).toBe(true);
    expect(restarted.market).toEqual([]);
    expect(restarted.winnerId).toBeNull();
  });
});
