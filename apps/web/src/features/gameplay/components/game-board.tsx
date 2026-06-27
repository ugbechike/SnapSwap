import type { Card as SnapSwapCard, CardGroup, GameSnapshot, Player } from "@snap-swap/shared";
import { GameCard } from "@snap-swap/ui";
import { useGameplay } from "../hooks/use-gameplay";

interface GameBoardProps {
  room: GameSnapshot;
  playerId: string | null;
  message: string;
  onMessage: (message: string) => void;
}

interface RunInfo {
  count: number;
  card: SnapSwapCard | null;
}

const cardKey = (card: SnapSwapCard | null) => card ? `${card.packId}:${card.groupKey}:${card.itemKey}` : "empty";

const matchingRun = (group: CardGroup): RunInfo => {
  const counts = new Map<string, { count: number; card: SnapSwapCard }>();
  for (const card of group.slots) {
    if (!card) continue;
    const key = cardKey(card);
    const current = counts.get(key);
    counts.set(key, { count: (current?.count ?? 0) + 1, card });
  }

  return [...counts.values()].sort((a, b) => b.count - a.count)[0] ?? { count: 0, card: null };
};

function SetPips({ value, max = 4, done = false, variant = "bars" }: { value: number; max?: number; done?: boolean; variant?: "bars" | "dots" }) {
  return (
    <span className={`sg-pips sg-pips--${variant}`} aria-label={`${value} of ${max} matching cards`}>
      {Array.from({ length: max }, (_, index) => (
        <span className={index < value ? done ? "sg-pip sg-pip--done sg-pip--filled" : "sg-pip sg-pip--filled" : "sg-pip"} key={index} />
      ))}
    </span>
  );
}

function RivalPanel({ player, lead }: { player: Player; lead: boolean }) {
  const activeGroup = player.groups[player.activeGroup];
  const run = activeGroup ? matchingRun(activeGroup) : { count: 0, card: null };
  const completedCount = player.groups.filter((group) => group.complete).length;

  return (
    <article className="sg-rival-card">
      <header className="sg-rival-head">
        <div className="sg-avatar" style={{ background: player.avatarColor }}>{player.name.charAt(0).toUpperCase()}</div>
        <div>
          <div className="sg-rival-name">{player.name}{lead ? <span className="sg-lead">Lead</span> : null}</div>
          <div className="sg-rival-meta">Set {player.activeGroup + 1} · {run.count}/4</div>
        </div>
        <SetPips value={completedCount} max={3} done variant="dots" />
      </header>

      <div className="sg-rival-cards">
        {activeGroup?.slots.map((card, index) => card ? (
          <GameCard card={card} mini disabled key={card.id} />
        ) : (
          <div className="sg-mini-back" key={`rival-${index}`} />
        ))}
      </div>
    </article>
  );
}

function SetTab({
  group,
  index,
  active,
  onClick
}: {
  group: CardGroup;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const run = matchingRun(group);
  const status = group.complete ? "Done" : active ? "Open" : "Hidden";

  return (
    <button className={`sg-set-tab ${active ? "sg-set-tab--active" : ""} ${group.complete ? "sg-set-tab--done" : ""}`} type="button" onClick={onClick}>
      <span>
        <strong>Set {index + 1}</strong>
        <small>{status}</small>
      </span>
      <SetPips value={run.count} done={group.complete} />
    </button>
  );
}

export function GameBoard({ room, playerId, message, onMessage }: GameBoardProps) {
  const gameplay = useGameplay({ room, playerId, onMessage });
  const player = gameplay.player;

  if (!player) {
    return <section className="sg-game"><p className="landing-status">Rejoin the room to play from this browser.</p></section>;
  }

  const rivals = room.players.filter((candidate) => candidate.id !== player.id);
  const activeGroup = player.groups[player.activeGroup];
  const activeRun = activeGroup ? matchingRun(activeGroup) : { count: 0, card: null };
  const leaderScore = Math.max(...room.players.map((candidate) => candidate.groups.filter((group) => group.complete).length));

  return (
    <section className="sg-game" aria-label="Game board">
      <header className="sg-header">
        <div className="sg-brand">
          <span className="sg-logo">S</span>
          <strong>SnapSwap</strong>
        </div>
        <button className="sg-chip sg-room-chip" type="button" title="Copy room code">
          <span>Room</span>
          <strong>{room.code}</strong>
        </button>
        <div className="sg-header-spacer" />
        <span className="sg-chip">👥 {room.players.length}/{room.config.maxPlayers}</span>
        <span className="sg-chip sg-live"><span />Live</span>
        <button className="sg-icon-button" type="button" aria-label="How to play">?</button>
        <button className="sg-leave-button" type="button">Leave</button>
      </header>

      <main className="sg-main">
        <section className="sg-rivals" aria-label="Rivals">
          <div className="sg-section-label">Rivals <span>· {rivals.length} racing live, revealed sets shown</span></div>
          <div className="sg-rivals-rail">
            {rivals.map((rival) => (
              <RivalPanel lead={rival.groups.filter((group) => group.complete).length === leaderScore && leaderScore > 0} player={rival} key={rival.id} />
            ))}
          </div>
        </section>

        <section className="sg-market-stage" aria-label="Center market">
          <div className="sg-market-inner">
            <div className="sg-market-title">
              <span>Center Market</span>
              <small>{room.market.filter(Boolean).length} up for grabs</small>
            </div>
            <div className="sg-market-grid">
              {room.market.map((card, index) => card ? (
                <GameCard
                  card={card}
                  selected={gameplay.selectedMarketIndex === index}
                  onClick={() => gameplay.selectMarketCard(index)}
                  key={card.id}
                />
              ) : (
                <div className="sg-empty-card" key={`market-${index}`}>Taken</div>
              ))}
            </div>
            <p className="sg-hint">{message}</p>
          </div>
        </section>
      </main>

      <footer className="sg-dock">
        <div className="sg-dock-inner">
          <div className="sg-set-switcher">
            <div className="sg-section-label sg-section-label--you">Your sets <span>· one open at a time</span></div>
            <div className="sg-set-tabs">
              {player.groups.map((group, index) => (
                <SetTab
                  active={index === player.activeGroup}
                  group={group}
                  index={index}
                  key={`set-${index}`}
                  onClick={() => gameplay.selectGroup(index)}
                />
              ))}
            </div>
          </div>

          <section className="sg-open-set" aria-label="Your open set">
            <header className="sg-open-set-head">
              <span>Set {player.activeGroup + 1} · Open</span>
              <strong>{activeGroup?.complete ? "Completed ✓" : activeRun.card ? `${activeRun.card.groupName} ${activeRun.card.itemName} · ${activeRun.count}/4` : "Build a set"}</strong>
            </header>
            <div className="sg-open-cards">
              {activeGroup?.slots.map((card, slotIndex) => card ? (
                <GameCard
                  card={card}
                  matched={activeGroup.complete}
                  selected={gameplay.selectedPlayerCard?.groupIndex === player.activeGroup && gameplay.selectedPlayerCard.slotIndex === slotIndex}
                  disabled={activeGroup.complete}
                  onClick={() => gameplay.selectPlayerCard(player.activeGroup, slotIndex)}
                  key={card.id}
                />
              ) : (
                <div className="sg-empty-card" key={`slot-${slotIndex}`}>Empty</div>
              ))}
            </div>
          </section>
        </div>
      </footer>
    </section>
  );
}
