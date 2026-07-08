import type { Card as SnapSwapCard, CardGroup, GameSnapshot, Player } from "@snap-swap/shared";
import { GameCard } from "@snap-swap/ui";
import { useEffect, useState } from "react";
import { useGameplay } from "../hooks/use-gameplay";

interface GameBoardProps {
  room: GameSnapshot;
  playerId: string | null;
  message: string;
  onMessage: (message: string) => void;
  onLeave: () => void | Promise<void>;
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

function RivalPanel({ player, lead, label }: { player: Player; lead: boolean; label?: string }) {
  const activeGroup = player.groups[player.activeGroup];
  const run = activeGroup ? matchingRun(activeGroup) : { count: 0, card: null };
  const completedCount = player.groups.filter((group) => group.complete).length;

  return (
    <article className="sg-rival-card">
      <header className="sg-rival-head">
        <div className="sg-avatar" style={{ background: player.avatarColor }}>{player.name.charAt(0).toUpperCase()}</div>
        <div>
          <div className="sg-rival-name">
            {player.name}
            {label ? <span className="sg-soft-badge">{label}</span> : null}
            {lead ? <span className="sg-lead">Lead</span> : null}
          </div>
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

export function GameBoard({ room, playerId, message, onMessage, onLeave }: GameBoardProps) {
  const gameplay = useGameplay({ room, playerId, onMessage });
  const player = gameplay.player;
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (!participantsOpen && !helpOpen && !leaveConfirmOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setParticipantsOpen(false);
        setHelpOpen(false);
        setLeaveConfirmOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [helpOpen, leaveConfirmOpen, participantsOpen]);

  useEffect(() => {
    if (!copyStatus) return;
    const timeout = window.setTimeout(() => setCopyStatus(""), 1600);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  if (!player) {
    return <section className="sg-game"><p className="landing-status">Rejoin the room to play from this browser.</p></section>;
  }

  const rivals = room.players.filter((candidate) => candidate.id !== player.id);
  const activeGroup = player.groups[player.activeGroup];
  const activeRun = activeGroup ? matchingRun(activeGroup) : { count: 0, card: null };
  const leaderScore = Math.max(...room.players.map((candidate) => candidate.groups.filter((group) => group.complete).length));
  const isLead = (candidate: Player) => candidate.groups.filter((group) => group.complete).length === leaderScore && leaderScore > 0;
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopyStatus("Copied");
      onMessage(`Room code ${room.code} copied.`);
    } catch {
      setCopyStatus("Copy failed");
      onMessage("Could not copy the room code. Select it manually and try again.");
    }
  };

  return (
    <section className="sg-game" aria-label="Game board">
      <header className="sg-header">
        <div className="sg-brand">
          <span className="sg-logo">S</span>
          <strong>SnapSwap</strong>
        </div>
        <button className="sg-chip sg-room-chip" type="button" title="Copy room code" onClick={() => void copyRoomCode()}>
          <span>Room</span>
          <strong>{room.code}</strong>
          <small aria-live="polite">{copyStatus || "Copy"}</small>
        </button>
        <div className="sg-header-spacer" />
        <button className="sg-chip sg-player-count" type="button" aria-controls="sg-guest-drawer" aria-expanded={participantsOpen} onClick={() => setParticipantsOpen(true)}>
          <span aria-hidden="true">👥</span>
          <strong>{room.players.length}/{room.config.maxPlayers}</strong>
        </button>
        <span className="sg-chip sg-live"><span />Live</span>
        <button className="sg-icon-button" type="button" aria-label="How to play" onClick={() => setHelpOpen(true)}>?</button>
        <button className="sg-leave-button" type="button" onClick={() => setLeaveConfirmOpen(true)}>Leave</button>
      </header>

      {participantsOpen ? (
        <div className="sg-guest-drawer" id="sg-guest-drawer">
          <button className="sg-guest-drawer-backdrop" type="button" aria-label="Close participants drawer" onClick={() => setParticipantsOpen(false)} />
          <aside className="sg-guest-sheet" role="dialog" aria-modal="true" aria-labelledby="sg-guest-title">
            <header className="sg-guest-sheet-head">
              <div>
                <span className="sg-section-label" id="sg-guest-title">Participants</span>
                <p>{room.players.length}/{room.config.maxPlayers} in room · active sets shown</p>
              </div>
              <button className="sg-guest-close" type="button" aria-label="Close participants drawer" autoFocus onClick={() => setParticipantsOpen(false)}>×</button>
            </header>
            <div className="sg-guest-list">
              {room.players.map((participant) => (
                <RivalPanel
                  label={participant.id === player.id ? "You" : participant.isHost ? "Host" : undefined}
                  lead={isLead(participant)}
                  player={participant}
                  key={participant.id}
                />
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {helpOpen ? (
        <div className="sg-modal" role="dialog" aria-modal="true" aria-labelledby="sg-help-title">
          <button className="sg-modal-backdrop" type="button" aria-label="Close how to play" onClick={() => setHelpOpen(false)} />
          <section className="sg-modal-card">
            <header className="sg-modal-head">
              <h2 id="sg-help-title">How to play SnapSwap</h2>
              <button className="sg-guest-close" type="button" aria-label="Close how to play" autoFocus onClick={() => setHelpOpen(false)}>×</button>
            </header>
            <ol className="sg-help-list">
              <li><strong>Pick from the center market.</strong><span>Tap any available market card you want.</span></li>
              <li><strong>Pick one of your open cards.</strong><span>You can also tap your card first, then the market card.</span></li>
              <li><strong>Swap toward four of a kind.</strong><span>Only your active set is open. Hidden sets stay concealed until selected.</span></li>
              <li><strong>Finish three sets to win.</strong><span>Complete all your sets before the other players do.</span></li>
            </ol>
          </section>
        </div>
      ) : null}

      {leaveConfirmOpen ? (
        <div className="sg-modal" role="dialog" aria-modal="true" aria-labelledby="sg-leave-title">
          <button className="sg-modal-backdrop" type="button" aria-label="Cancel leaving room" onClick={() => setLeaveConfirmOpen(false)} />
          <section className="sg-modal-card sg-modal-card--compact">
            <header className="sg-modal-head">
              <h2 id="sg-leave-title">Leave this room?</h2>
            </header>
            <p className="sg-modal-copy">You’ll be removed from this game. You can rejoin later with the room code if the room is still open.</p>
            <div className="sg-modal-actions">
              <button className="sg-modal-button" type="button" autoFocus onClick={() => setLeaveConfirmOpen(false)}>Cancel</button>
              <button
                className="sg-modal-button sg-modal-button--danger"
                type="button"
                onClick={() => {
                  setLeaveConfirmOpen(false);
                  void onLeave();
                }}
              >
                Leave room
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <main className="sg-main">
        <section className="sg-rivals" aria-label="Rivals">
          <div className="sg-section-label">Rivals <span>· {rivals.length} racing live, revealed sets shown</span></div>
          <div className="sg-rivals-rail">
            {rivals.map((rival) => (
              <RivalPanel lead={isLead(rival)} player={rival} key={rival.id} />
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
