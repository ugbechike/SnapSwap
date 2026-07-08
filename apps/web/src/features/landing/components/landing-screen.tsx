"use client";

import { Button, Card, Input, Stack } from "@snap-swap/ui";
import { useEffect, useState } from "react";
import { GameBoard } from "../../gameplay";
import { VictoryPanel } from "../../victory";
import { useRoomForm } from "../hooks/use-room-form";

type LandingMode = "start" | "join";

export function LandingScreen() {
  const form = useRoomForm();
  const isGameScreen = form.room?.status === "playing" || form.room?.status === "finished";
  const [copyStatus, setCopyStatus] = useState("");
  const [landingMode, setLandingMode] = useState<LandingMode>("start");

  useEffect(() => {
    if (!copyStatus) return;
    const timeout = window.setTimeout(() => setCopyStatus(""), 1600);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyRoomCode = async () => {
    if (!form.room) return;

    try {
      await navigator.clipboard.writeText(form.room.code);
      setCopyStatus("Copied");
      form.setMessage(`Room code ${form.room.code} copied.`);
    } catch {
      setCopyStatus("Copy failed");
      form.setMessage("Could not copy the room code. Select it manually and try again.");
    }
  };

  const shareRoomCode = async () => {
    if (!form.room) return;

    const shareData = {
      title: "Join my SnapSwap room",
      text: `Join my SnapSwap game with room code ${form.room.code}.`,
      url: window.location.origin
    };

    try {
      if ("share" in navigator) {
        await navigator.share(shareData);
        form.setMessage("Room invite shared.");
        return;
      }

      await copyRoomCode();
      form.setMessage("Sharing is not available here, so the room code was copied instead.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      form.setMessage("Could not open sharing. Tap the room code to copy it instead.");
    }
  };

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
          <GameBoard room={form.room} playerId={form.playerId} message={form.message} onLeave={form.leaveRoom} onMessage={form.setMessage} />
        ) : form.room?.status === "finished" ? (
          <VictoryPanel room={form.room} playerId={form.playerId} onMessage={form.setMessage} />
        ) : (
          <Card className="landing-card">
            {form.room ? (
            <section className="landing-lobby" aria-label="Room lobby">
              <span className="ff-eyebrow">Room code</span>
              <button className="landing-room-code" type="button" title="Copy room code" onClick={() => void copyRoomCode()}>
                <strong>{form.room.code}</strong>
                <small aria-live="polite">{copyStatus || "Tap to copy"}</small>
              </button>
              <p className="landing-lobby-copy">Share this code with another player to join the lobby.</p>
              <div className="landing-lobby-actions">
                <Button full variant="secondary" onClick={() => void shareRoomCode()}>Share invite</Button>
              </div>

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
            <section className="landing-entry" aria-label="Choose how to play">
              <div className="landing-mode-tabs" role="tablist" aria-label="Choose start or join">
                <button
                  className={`landing-mode-tab ${landingMode === "start" ? "landing-mode-tab--active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={landingMode === "start"}
                  onClick={() => setLandingMode("start")}
                >
                  <strong>Start a game</strong>
                  <span>Create a room code</span>
                </button>
                <button
                  className={`landing-mode-tab ${landingMode === "join" ? "landing-mode-tab--active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={landingMode === "join"}
                  onClick={() => setLandingMode("join")}
                >
                  <strong>Join a game</strong>
                  <span>Use an existing code</span>
                </button>
              </div>

              {landingMode === "start" ? (
                <div className="landing-entry-form" role="tabpanel" aria-label="Start a game">
                  <Input
                    label="Player name"
                    placeholder="Your name"
                    maxLength={24}
                    value={form.playerName}
                    onChange={(event) => form.setPlayerName(event.target.value)}
                  />
                  <Button full breathe disabled={form.busy} onClick={form.createRoom}>
                    {form.busy ? "Creating…" : "Create code"}
                  </Button>
                  <p className="landing-flow-note">You’ll get a room code to copy or share with other players.</p>
                </div>
              ) : (
                <div className="landing-entry-form" role="tabpanel" aria-label="Join a game">
                  <Input
                    label="Player name"
                    placeholder="Your name"
                    maxLength={24}
                    value={form.playerName}
                    onChange={(event) => form.setPlayerName(event.target.value)}
                  />
                  <Input
                    label="Room code"
                    code
                    placeholder="SNAP42"
                    maxLength={6}
                    value={form.roomCode}
                    onChange={(event) => form.setRoomCode(event.target.value.toUpperCase())}
                  />
                  <Button full variant="secondary" disabled={form.busy} onClick={form.joinRoom}>
                    {form.busy ? "Joining…" : "Join game"}
                  </Button>
                </div>
              )}
            </section>
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
