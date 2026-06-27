"use client";

import { Button, Card, Input, Stack } from "@snap-swap/ui";
import { GameBoard } from "../../gameplay";
import { VictoryPanel } from "../../victory";
import { useRoomForm } from "../hooks/use-room-form";

export function LandingScreen() {
  const form = useRoomForm();
  const isGameScreen = form.room?.status === "playing" || form.room?.status === "finished";

  return (
    <main className={`landing-page ${isGameScreen ? "landing-page--game" : ""}`}>
      <div className="landing-ambient" aria-hidden="true">
        <span className="landing-blob landing-blob--peach" />
        <span className="landing-blob landing-blob--lilac" />
      </div>

      <section className={`landing-content ${form.room?.status === "playing" ? "landing-content--game" : ""}`}>
        <Stack gap={10} style={{ alignItems: "center" }}>
          <span className="ff-eyebrow">Real-time card race</span>
          <h1 className="landing-wordmark"><em>Snap</em><strong>SWAP</strong></h1>
          <p className="landing-tagline">Race to complete three matching sets. No turns. First to finish wins.</p>
        </Stack>

        {form.room?.status === "playing" ? (
          <GameBoard room={form.room} playerId={form.playerId} message={form.message} onMessage={form.setMessage} />
        ) : form.room?.status === "finished" ? (
          <VictoryPanel room={form.room} playerId={form.playerId} onMessage={form.setMessage} />
        ) : (
          <Card className="landing-card">
            {form.room ? (
            <section className="landing-lobby" aria-label="Room lobby">
              <span className="ff-eyebrow">Room code</span>
              <strong className="landing-room-code">{form.room.code}</strong>
              <p className="landing-lobby-copy">Share this code with another player to join the lobby.</p>

              <div className="landing-player-list">
                {form.room.players.map((player) => (
                  <div className="landing-player-row" key={player.id}>
                    <span className="landing-player-dot" style={{ background: player.avatarColor }} />
                    <span>{player.name}{player.id === form.playerId ? " (you)" : ""}</span>
                    {player.isHost ? <small>Host</small> : null}
                  </div>
                ))}
              </div>

              {form.room.players.find((player) => player.id === form.playerId)?.isHost ? (
                <Button
                  full
                  breathe={form.room.players.length >= form.room.config.minPlayers}
                  disabled={form.busy || form.room.players.length < form.room.config.minPlayers}
                  onClick={form.startGame}
                >
                  {form.room.players.length < form.room.config.minPlayers
                    ? `Need ${form.room.config.minPlayers} players`
                    : "Start game"}
                </Button>
              ) : (
                <p className="landing-lobby-copy">Waiting for the host to start the game.</p>
              )}
            </section>
            ) : (
            <>
              <Input
                label="Player name"
                placeholder="Your name"
                maxLength={24}
                value={form.playerName}
                onChange={(event) => form.setPlayerName(event.target.value)}
              />
              <Button full breathe disabled={form.busy} onClick={form.createRoom}>
                {form.busy ? "Connecting…" : "Create room"}
              </Button>
              <Input
                label="Room code"
                code
                placeholder="SNAP42"
                maxLength={6}
                value={form.roomCode}
                onChange={(event) => form.setRoomCode(event.target.value.toUpperCase())}
              />
              <Button full variant="secondary" disabled={form.busy} onClick={form.joinRoom}>
                Join room by code
              </Button>
            </>
            )}
            <p className="landing-status" aria-live="polite">{form.message}</p>
          </Card>
        )}

        {!isGameScreen ? (
          <div className="landing-note">{form.connected ? "Connected to SnapSwap server" : "Next.js App Router shell ready"}</div>
        ) : null}
      </section>
    </main>
  );
}
