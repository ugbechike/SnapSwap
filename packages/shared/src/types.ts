export type RoomStatus = "lobby" | "playing" | "finished";

export interface PackGroup {
  key: string;
  name: string;
  color: string;
}

export interface PackItem {
  key: string;
  name: string;
}

export interface CardPack {
  id: string;
  name: string;
  groups: readonly PackGroup[];
  items: readonly PackItem[];
}

export interface CardTarget {
  packId: string;
  groupKey: string;
  groupName: string;
  itemKey: string;
  itemName: string;
  color: string;
}

export interface Card extends CardTarget {
  id: string;
}

export interface CardGroup {
  target: CardTarget;
  slots: Array<Card | null>;
  complete: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  activeGroup: number;
  groups: CardGroup[];
}

export type FeedKind = "join" | "grab" | "set" | "system";

export interface FeedEntry {
  id: string;
  playerId?: string;
  who: string;
  text: string;
  color: string;
  kind: FeedKind;
}

export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
  groupsPerPlayer: number;
  cardsPerGroup: number;
  marketSize: number;
  durationSeconds: number;
  copiesPerCard: number;
}

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  pack: CardPack;
  config: GameConfig;
  players: Player[];
  market: Array<Card | null>;
  drawPile: Card[];
  feed: FeedEntry[];
  winnerId: string | null;
  startedAt: number | null;
  round: number;
  version: number;
}

export interface NewPlayer {
  id: string;
  name: string;
  avatarColor?: string;
}

export interface CreateRoomInput {
  id: string;
  code: string;
  host: NewPlayer;
  pack?: CardPack;
  config?: Partial<GameConfig>;
}

export interface SwapIntent {
  playerId: string;
  groupIndex: number;
  slotIndex: number;
  marketIndex: number;
}

export interface GameSnapshot extends Room {
  serverTime: number;
}

export type ClientToServerEvents = {
  "room:create": (payload: { name: string }, reply: (result: RoomReply) => void) => void;
  "room:join": (payload: { code: string; name: string }, reply: (result: RoomReply) => void) => void;
  "room:leave": (reply: (result: ActionReply) => void) => void;
  "game:start": (reply: (result: ActionReply) => void) => void;
  "game:select-group": (payload: { groupIndex: number }, reply: (result: ActionReply) => void) => void;
  "game:swap": (payload: Omit<SwapIntent, "playerId">, reply: (result: ActionReply) => void) => void;
  "game:restart": (reply: (result: ActionReply) => void) => void;
};

export type ServerToClientEvents = {
  "room:state": (snapshot: GameSnapshot) => void;
  "room:error": (message: string) => void;
};

export interface RoomReply {
  ok: boolean;
  room?: GameSnapshot;
  playerId?: string;
  message?: string;
}

export interface ActionReply {
  ok: boolean;
  message?: string;
}
