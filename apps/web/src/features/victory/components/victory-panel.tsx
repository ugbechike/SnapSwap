import type { GameSnapshot } from "@snap-swap/shared";
import { Button, Card, ProgressIndicator } from "@snap-swap/ui";
import type { CSSProperties } from "react";
import { useGameplay } from "../../gameplay";

interface VictoryPanelProps {
  room: GameSnapshot;
  playerId: string | null;
  onMessage: (message: string) => void;
}

const celebrationRibbons = [
  { left: "6%", delay: "0s", duration: "2.7s", color: "#56ACFF", rotate: "18deg" },
  { left: "12%", delay: ".18s", duration: "3.1s", color: "#FFD45E", rotate: "-24deg" },
  { left: "18%", delay: ".04s", duration: "2.9s", color: "#FF7A90", rotate: "32deg" },
  { left: "25%", delay: ".34s", duration: "3.4s", color: "#55D68A", rotate: "-16deg" },
  { left: "31%", delay: ".12s", duration: "2.8s", color: "#B990FF", rotate: "26deg" },
  { left: "38%", delay: ".42s", duration: "3.2s", color: "#FFB15E", rotate: "-30deg" },
  { left: "45%", delay: ".08s", duration: "2.6s", color: "#56ACFF", rotate: "14deg" },
  { left: "52%", delay: ".28s", duration: "3.5s", color: "#FFD45E", rotate: "-20deg" },
  { left: "60%", delay: ".16s", duration: "2.9s", color: "#FF7A90", rotate: "34deg" },
  { left: "68%", delay: ".36s", duration: "3.3s", color: "#55D68A", rotate: "-12deg" },
  { left: "76%", delay: ".02s", duration: "2.7s", color: "#B990FF", rotate: "22deg" },
  { left: "84%", delay: ".24s", duration: "3.1s", color: "#FFB15E", rotate: "-28deg" },
  { left: "91%", delay: ".1s", duration: "2.8s", color: "#56ACFF", rotate: "30deg" },
  { left: "96%", delay: ".46s", duration: "3.4s", color: "#FFD45E", rotate: "-18deg" }
] as const;

function VictoryCelebration() {
  return (
    <div className="victory-celebration" aria-hidden="true">
      {celebrationRibbons.map((ribbon, index) => (
        <span
          className="victory-ribbon"
          style={{
            "--ribbon-left": ribbon.left,
            "--ribbon-delay": ribbon.delay,
            "--ribbon-duration": ribbon.duration,
            "--ribbon-color": ribbon.color,
            "--ribbon-rotate": ribbon.rotate
          } as CSSProperties}
          key={`${ribbon.left}-${index}`}
        />
      ))}
    </div>
  );
}

export function VictoryPanel({ room, playerId, onMessage }: VictoryPanelProps) {
  const gameplay = useGameplay({ room, playerId, onMessage });
  const winner = room.players.find((player) => player.id === room.winnerId);
  const currentPlayer = room.players.find((player) => player.id === playerId);
  const canRestart = currentPlayer?.isHost || currentPlayer?.id === room.winnerId;
  const didCurrentPlayerWin = room.winnerId !== null && room.winnerId === playerId;

  return (
    <>
      {didCurrentPlayerWin ? <VictoryCelebration /> : null}
      <Card className={`victory-panel ${didCurrentPlayerWin ? "victory-panel--winner" : ""}`} aria-label="Victory screen">
        <span className="ff-eyebrow">{didCurrentPlayerWin ? "You did it" : "Game over"}</span>
        <h2 className="victory-title">{winner ? `${winner.name} wins!` : "Round finished"}</h2>
        <p className="landing-lobby-copy">{didCurrentPlayerWin ? "Ribbons everywhere. That was a clean SnapSwap win." : "Final progress for this round."}</p>

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
    </>
  );
}
