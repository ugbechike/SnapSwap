import type { GameSnapshot } from "@snap-swap/shared";
import { Button, Card, ProgressIndicator } from "@snap-swap/ui";
import { useGameplay } from "../../gameplay";

interface VictoryPanelProps {
  room: GameSnapshot;
  playerId: string | null;
  onMessage: (message: string) => void;
}

export function VictoryPanel({ room, playerId, onMessage }: VictoryPanelProps) {
  const gameplay = useGameplay({ room, playerId, onMessage });
  const winner = room.players.find((player) => player.id === room.winnerId);
  const currentPlayer = room.players.find((player) => player.id === playerId);
  const canRestart = currentPlayer?.isHost || currentPlayer?.id === room.winnerId;

  return (
    <Card className="victory-panel" aria-label="Victory screen">
      <span className="ff-eyebrow">Game over</span>
      <h2 className="victory-title">{winner ? `${winner.name} wins!` : "Round finished"}</h2>
      <p className="landing-lobby-copy">Final progress for this round.</p>

      <div className="game-player-progress">
        {room.players.map((player) => {
          const completeCount = player.groups.filter((group) => group.complete).length;
          return (
            <div className="game-player-progress__row" key={player.id}>
              <span>{player.name}</span>
              <small>{completeCount}/{room.config.groupsPerPlayer}</small>
              <ProgressIndicator value={completeCount} max={room.config.groupsPerPlayer} color={player.avatarColor} height={6} />
            </div>
          );
        })}
      </div>

      {canRestart ? (
        <Button full breathe onClick={gameplay.restartGame}>Play again</Button>
      ) : (
        <p className="landing-status">Waiting for the host or winner to start another round.</p>
      )}
    </Card>
  );
}
