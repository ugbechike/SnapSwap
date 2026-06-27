import { DEFAULT_GAME_CONFIG, FASHION_PACK } from "./pack.js";
import type {
  Card,
  CardGroup,
  CardPack,
  CardTarget,
  CreateRoomInput,
  NewPlayer,
  Player,
  Room,
  SwapIntent
} from "./types.js";

export class GameEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameEngineError";
  }
}

const normalizeCode = (code: string) => code.trim().toUpperCase();
const cleanName = (name: string) => name.trim().slice(0, 24);
const targetKey = (target: CardTarget) => `${target.packId}:${target.groupKey}:${target.itemKey}`;
const groupCompletionKey = (group: CardGroup) => {
  if (group.slots.length === 0 || group.slots.some((card) => card === null)) return null;
  const [firstCard] = group.slots;
  if (!firstCard) return null;
  const firstKey = targetKey(firstCard);
  return group.slots.every((card) => card !== null && targetKey(card) === firstKey) ? firstKey : null;
};

const withCompletedGroups = (player: Player): Player => ({
  ...player,
  groups: player.groups.map((group) => ({
    ...group,
    complete: groupCompletionKey(group) !== null
  }))
});

export function createDeck(pack: CardPack = FASHION_PACK, copiesPerCard = DEFAULT_GAME_CONFIG.copiesPerCard): Card[] {
  if (!Number.isInteger(copiesPerCard) || copiesPerCard < 1) {
    throw new GameEngineError("copiesPerCard must be a positive integer");
  }
  return pack.groups.flatMap((group) =>
    pack.items.flatMap((item) =>
      Array.from({ length: copiesPerCard }, (_, copy) => ({
        id: `${pack.id}:${group.key}:${item.key}:${copy + 1}`,
        packId: pack.id,
        groupKey: group.key,
        groupName: group.name,
        itemKey: item.key,
        itemName: item.name,
        color: group.color
      }))
    )
  );
}

export function shuffleDeck<T>(deck: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...deck];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return shuffled;
}

export function createRoom(input: CreateRoomInput): Room {
  const name = cleanName(input.host.name);
  if (!name) throw new GameEngineError("Player name is required");
  const pack = input.pack ?? FASHION_PACK;
  const config = { ...DEFAULT_GAME_CONFIG, ...input.config };
  const host: Player = {
    id: input.host.id,
    name,
    avatarColor: input.host.avatarColor ?? pack.groups[0]?.color ?? "#C7A8E0",
    isHost: true,
    activeGroup: 0,
    groups: []
  };
  return {
    id: input.id,
    code: normalizeCode(input.code),
    status: "lobby",
    pack,
    config,
    players: [host],
    market: [],
    drawPile: [],
    feed: [{ id: "feed:1", playerId: host.id, who: host.name, text: "opened the room", color: host.avatarColor, kind: "join" }],
    winnerId: null,
    startedAt: null,
    round: 0,
    version: 1
  };
}

export function addPlayerToRoom(room: Room, newPlayer: NewPlayer): Room {
  if (room.status !== "lobby") throw new GameEngineError("This game has already started");
  if (room.players.length >= room.config.maxPlayers) throw new GameEngineError("This room is full");
  if (room.players.some((player) => player.id === newPlayer.id)) return room;
  const name = cleanName(newPlayer.name);
  if (!name) throw new GameEngineError("Player name is required");
  const palette = room.pack.groups.map((group) => group.color);
  const player: Player = {
    id: newPlayer.id,
    name,
    avatarColor: newPlayer.avatarColor ?? palette[room.players.length % palette.length] ?? "#C7A8E0",
    isHost: false,
    activeGroup: 0,
    groups: []
  };
  return {
    ...room,
    players: [...room.players, player],
    feed: [{ id: `feed:${room.version + 1}`, playerId: player.id, who: player.name, text: "joined the room", color: player.avatarColor, kind: "join" as const }, ...room.feed].slice(0, 20),
    version: room.version + 1
  };
}

function allTargets(pack: CardPack): CardTarget[] {
  return pack.groups.flatMap((group) =>
    pack.items.map((item) => ({
      packId: pack.id,
      groupKey: group.key,
      groupName: group.name,
      itemKey: item.key,
      itemName: item.name,
      color: group.color
    }))
  );
}

export function dealCards(room: Room, deck: readonly Card[], targets: readonly CardTarget[] = allTargets(room.pack)): Room {
  const handSize = room.config.groupsPerPlayer * room.config.cardsPerGroup;
  const cardsNeeded = room.players.length * handSize + room.config.marketSize;
  const targetsNeeded = room.players.length * room.config.groupsPerPlayer;
  if (deck.length < cardsNeeded) throw new GameEngineError("The deck does not contain enough cards");
  if (targets.length < targetsNeeded) throw new GameEngineError("The pack does not contain enough unique targets");

  let cardCursor = 0;
  let targetCursor = 0;
  const players = room.players.map((player) => {
    const groups: CardGroup[] = Array.from({ length: room.config.groupsPerPlayer }, () => {
      const target = targets[targetCursor++]!;
      const slots = deck.slice(cardCursor, cardCursor + room.config.cardsPerGroup);
      cardCursor += room.config.cardsPerGroup;
      return { target, slots, complete: groupCompletionKey({ target, slots, complete: false }) !== null };
    });
    return { ...player, activeGroup: 0, groups };
  });
  const market = deck.slice(cardCursor, cardCursor + room.config.marketSize);
  cardCursor += room.config.marketSize;
  return { ...room, players, market, drawPile: deck.slice(cardCursor), version: room.version + 1 };
}

export function startGame(room: Room, random: () => number = Math.random, startedAt = Date.now()): Room {
  if (room.status !== "lobby") throw new GameEngineError("The room is not waiting for a game");
  if (room.players.length < room.config.minPlayers) throw new GameEngineError(`At least ${room.config.minPlayers} players are required`);
  const targets = shuffleDeck(allTargets(room.pack), random);
  const assignedTargets = targets.slice(0, room.players.length * room.config.groupsPerPlayer);
  const assignedKeys = new Set(assignedTargets.map(targetKey));
  const deck = createDeck(room.pack, room.config.copiesPerCard);
  const guaranteedCards = deck.filter((card) => assignedKeys.has(targetKey(card)));
  const otherCards = deck.filter((card) => !assignedKeys.has(targetKey(card)));
  const cardsNeeded = room.players.length * room.config.groupsPerPlayer * room.config.cardsPerGroup + room.config.marketSize;
  const fillerCount = cardsNeeded - guaranteedCards.length;
  if (fillerCount < 0) throw new GameEngineError("The configured deck has more required target cards than live card slots");
  const shuffledOthers = shuffleDeck(otherCards, random);
  const liveDeck = shuffleDeck([...guaranteedCards, ...shuffledOthers.slice(0, fillerCount)], random);
  const dealt = dealCards(room, [...liveDeck, ...shuffledOthers.slice(fillerCount)], assignedTargets);
  return {
    ...dealt,
    status: "playing",
    winnerId: null,
    startedAt,
    round: room.round + 1,
    feed: [{ id: `feed:${dealt.version + 1}`, who: "Game", text: "The swap has begun", color: "#4B2A52", kind: "system" }, ...dealt.feed],
    version: dealt.version + 1
  };
}

export function selectActiveGroup(room: Room, playerId: string, groupIndex: number): Room {
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new GameEngineError("Player not found");
  if (!Number.isInteger(groupIndex) || groupIndex < 0 || groupIndex >= player.groups.length) {
    throw new GameEngineError("Group not found");
  }
  return {
    ...room,
    players: room.players.map((candidate) => candidate.id === playerId ? { ...candidate, activeGroup: groupIndex } : candidate),
    version: room.version + 1
  };
}

export function checkCompletedGroups(player: Player): boolean[] {
  return player.groups.map((group) => groupCompletionKey(group) !== null);
}

export function checkWinner(room: Room): Player | null {
  return room.players.find((player) => {
    const completed = checkCompletedGroups(player);
    return completed.length === room.config.groupsPerPlayer && completed.every(Boolean);
  }) ?? null;
}

export function swapCard(room: Room, intent: SwapIntent): Room {
  if (room.status !== "playing") throw new GameEngineError("The game is not active");
  const playerIndex = room.players.findIndex((player) => player.id === intent.playerId);
  if (playerIndex < 0) throw new GameEngineError("Player not found");
  const player = room.players[playerIndex]!;
  const group = player.groups[intent.groupIndex];
  if (!group) throw new GameEngineError("Group not found");
  if (group.complete) throw new GameEngineError("This set is locked in");
  const handCard = group.slots[intent.slotIndex];
  if (!handCard) throw new GameEngineError("Player card is unavailable");
  const marketCard = room.market[intent.marketIndex];
  if (!marketCard) throw new GameEngineError("Center card is unavailable");

  const slots = [...group.slots];
  slots[intent.slotIndex] = marketCard;
  const groups = player.groups.map((candidate, index) => index === intent.groupIndex ? { ...candidate, slots } : candidate);
  const updatedPlayer = withCompletedGroups({ ...player, groups });
  const market = [...room.market];
  market[intent.marketIndex] = handCard;
  const players = room.players.map((candidate, index) => index === playerIndex ? updatedPlayer : candidate);
  const newlyCompleted = !group.complete && updatedPlayer.groups[intent.groupIndex]?.complete;
  const grabEntry = { id: `feed:${room.version + 1}`, playerId: player.id, who: player.name, text: `grabbed ${marketCard.groupName} ${marketCard.itemName}`, color: player.avatarColor, kind: "grab" as const };
  const setEntry = newlyCompleted ? { id: `feed:${room.version + 1}:set`, playerId: player.id, who: player.name, text: `completed Set #${intent.groupIndex + 1}`, color: "#4F8A5A", kind: "set" as const } : null;
  const next: Room = {
    ...room,
    players,
    market,
    feed: [...(setEntry ? [setEntry] : []), grabEntry, ...room.feed].slice(0, 20),
    version: room.version + 1
  };
  const winner = checkWinner(next);
  return winner ? { ...next, status: "finished", winnerId: winner.id, version: next.version + 1 } : next;
}

export function restartGame(room: Room): Room {
  return {
    ...room,
    status: "lobby",
    players: room.players.map((player) => ({ ...player, activeGroup: 0, groups: [] })),
    market: [],
    drawPile: [],
    winnerId: null,
    startedAt: null,
    feed: [{ id: `feed:${room.version + 1}`, who: "Game", text: "Ready for another round", color: "#4B2A52", kind: "system" }],
    version: room.version + 1
  };
}
