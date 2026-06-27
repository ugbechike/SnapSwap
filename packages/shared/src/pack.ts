import type { CardPack, GameConfig } from "./types.js";

export const FASHION_PACK: CardPack = {
  id: "fashion",
  name: "Snap Swap",
  groups: [
    { key: "peach", name: "Peach", color: "#F4B26A" },
    { key: "lilac", name: "Lilac", color: "#C7A8E0" },
    { key: "coral", name: "Coral", color: "#E89A8A" },
    { key: "mint", name: "Mint", color: "#A9D4A0" },
    { key: "honey", name: "Honey", color: "#F7CB6B" },
    { key: "sky", name: "Sky", color: "#B6C9D8" }
  ],
  items: [
    { key: "dress", name: "Dress" },
    { key: "jacket", name: "Jacket" },
    { key: "pants", name: "Pants" },
    { key: "shoes", name: "Shoes" },
    { key: "hat", name: "Hat" },
    { key: "bag", name: "Bag" }
  ]
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  minPlayers: 2,
  maxPlayers: 6,
  groupsPerPlayer: 3,
  cardsPerGroup: 4,
  marketSize: 6,
  durationSeconds: 300,
  copiesPerCard: 4
};
