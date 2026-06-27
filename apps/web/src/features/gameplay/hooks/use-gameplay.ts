"use client";

import type { ActionReply, GameSnapshot } from "@snap-swap/shared";
import { useCallback, useState } from "react";
import { getSocketClient } from "../../socket";

interface GameplayOptions {
  room: GameSnapshot;
  playerId: string | null;
  onMessage: (message: string) => void;
}

export interface SelectedPlayerCard {
  groupIndex: number;
  slotIndex: number;
}

export function useGameplay({ room, playerId, onMessage }: GameplayOptions) {
  const [selectedPlayerCard, setSelectedPlayerCard] = useState<SelectedPlayerCard | null>(null);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number | null>(null);
  const player = room.players.find((candidate) => candidate.id === playerId) ?? null;

  const handleReply = useCallback((reply: ActionReply, successMessage: string) => {
    if (reply.ok) {
      onMessage(successMessage);
      return;
    }

    onMessage(reply.message ?? "That move did not go through.");
  }, [onMessage]);

  const selectGroup = useCallback((groupIndex: number) => {
    setSelectedPlayerCard(null);
    setSelectedMarketIndex(null);
    getSocketClient().emit("game:select-group", { groupIndex }, (reply) => {
      handleReply(reply, `Set ${groupIndex + 1} is active.`);
    });
  }, [handleReply]);

  const selectPlayerCard = useCallback((groupIndex: number, slotIndex: number) => {
    if (!player || groupIndex !== player.activeGroup) {
      onMessage("Switch to that set before selecting one of its cards.");
      return;
    }

    if (player.groups[groupIndex]?.complete) {
      onMessage("This set is locked in. Open another set to keep building.");
      return;
    }

    if (selectedMarketIndex !== null) {
      getSocketClient().emit("game:swap", { groupIndex, slotIndex, marketIndex: selectedMarketIndex }, (reply) => {
        handleReply(reply, reply.ok ? "Swap complete." : "That card was already taken.");
        if (reply.ok) {
          setSelectedPlayerCard(null);
          setSelectedMarketIndex(null);
        }
      });
      return;
    }

    if (selectedPlayerCard?.groupIndex === groupIndex && selectedPlayerCard.slotIndex === slotIndex) {
      setSelectedPlayerCard(null);
      onMessage("Selection cleared.");
      return;
    }

    setSelectedPlayerCard({ groupIndex, slotIndex });
    onMessage("Now tap a market card to swap it in.");
  }, [handleReply, onMessage, player, selectedMarketIndex, selectedPlayerCard]);

  const selectMarketCard = useCallback((marketIndex: number) => {
    if (!player) {
      onMessage("Rejoin the room to play from this browser.");
      return;
    }

    if (player.groups[player.activeGroup]?.complete) {
      onMessage("This set is locked in. Open another set to keep building.");
      return;
    }

    if (selectedMarketIndex === marketIndex) {
      setSelectedMarketIndex(null);
      onMessage("Selection cleared.");
      return;
    }

    if (!selectedPlayerCard) {
      setSelectedMarketIndex(marketIndex);
      onMessage("Now tap a card in your set to swap it in.");
      return;
    }

    getSocketClient().emit("game:swap", { ...selectedPlayerCard, marketIndex }, (reply) => {
      handleReply(reply, reply.ok ? "Swap complete." : "That card was already taken.");
      if (reply.ok) {
        setSelectedPlayerCard(null);
        setSelectedMarketIndex(null);
      }
    });
  }, [handleReply, onMessage, player, selectedMarketIndex, selectedPlayerCard]);

  const restartGame = useCallback(() => {
    getSocketClient().emit("game:restart", (reply) => {
      handleReply(reply, "Ready for another round.");
    });
  }, [handleReply]);

  return {
    player,
    selectedPlayerCard,
    selectedMarketIndex,
    selectGroup,
    selectPlayerCard,
    selectMarketCard,
    restartGame
  } as const;
}
