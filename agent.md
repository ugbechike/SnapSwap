# SnapSwap Agent Guide

Use `docs/snap-swap-prd.md` as the product source of truth while building SnapSwap.

## Product priorities

- SnapSwap is a real-time, multiplayer, server-authoritative card-matching party game.
- Minimum players: 2. Maximum players: 6. Recommended: 4–6.
- The game is simultaneous, not turn-based.
- The frontend must render server state and send player intents only.
- The server owns room storage, Socket.IO connections, validation, race handling, and broadcasts.
- The shared engine must remain pure TypeScript with no React, Next.js, Socket.IO, Node server, browser, or database dependencies.

## Current build order

1. `packages/shared` types and pure game engine
2. Engine unit tests
3. `packages/ui` design system
4. `apps/server` Socket.IO wrapper around the engine
5. `apps/web` Next.js App Router UI using the design system
6. Polish, README, and deployment setup

## Gameplay rules to preserve

- Host creates a room and shares the generated code.
- Players join by code.
- Host starts the game once at least 2 players are in the lobby.
- Each player receives 3 groups of 4 cards.
- The shared market contains 6 face-up cards.
- A player may only swap from their active group.
- Swaps use click-to-swap: select a player card, then select a market card.
- Never implement drag-and-drop for V1.
- The first valid server request for a market card wins.
- A group is complete when all 4 cards match its target.
- A player wins by completing all 3 groups.

## UI expectations

- Prefer `packages/ui` components over one-off page-level styling.
- Keep screens aligned with the provided design direction and document unclear design decisions in the README under “Design Implementation Notes.”
- Required V1 screens: landing, lobby, gameplay, and victory/play-again.

## Local development

- Web: `http://localhost:3000`
- Server: `http://localhost:3001`
- Web env: `NEXT_PUBLIC_SERVER_URL=http://localhost:3001`
- Server env: `WEB_ORIGIN=http://localhost:3000`

