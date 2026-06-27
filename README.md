# Snap Swap

A real-time, no-turns card race for 2–6 players. Players trade against one shared market and race to complete three matching sets.

## Architecture

- `packages/shared` — framework-free TypeScript types, pack definitions, immutable game engine, and unit tests
- `packages/ui` — Pocket Therapy-derived tokens, primitives, and game-specific React components
- `apps/server` — in-memory room storage and Socket.IO authority layer
- `apps/web` — Next.js App Router frontend prepared for server snapshots and player intents

The engine has no React, Socket.IO, Node, browser, or database dependencies. The server owns room state and applies swaps synchronously before broadcasting a new snapshot, which resolves contested market-card grabs in arrival order. The client never commits game transitions locally.

## Run locally

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The current landing page is an App Router shell; room actions are intentionally placeholders until the Socket.IO feature is connected.

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Adding a card pack

Create a `CardPack` with an `id`, display name, group dimension, and item dimension. `createDeck` builds the Cartesian product with configurable copies; dealing, swapping, completion, winner detection, room storage, and Socket.IO events stay unchanged. A fruit pack might use color as its group dimension and fruit type as its item dimension.

## Design Implementation Notes

The supplied HTML handoff and Pocket Therapy tokens are the visual source of truth. The implementation keeps its cream/plum palette, Manrope and Newsreader typography, warm shadows, pill controls, drifting lobby blobs, radial market, garment silhouettes, progress treatments, live feed, and deep-plum victory screen.

Practical decisions:

- The prototype's custom streaming-component runtime was reimplemented as React components; none of its runtime code is embedded.
- The handoff's unavailable hanger glyph is represented by Lucide's shirt icon while preserving the same market-medallion treatment.
- Progress counts are display-only derivations of server snapshots. Completion and winner transitions are calculated exclusively by the shared engine on the server.
- Swaps are intentionally not optimistic. This avoids showing a false win when two players contest the same market card.
- Rooms are in-memory for this version. A production multi-instance deployment should place a serialized mutation queue and shared room store (for example Redis) behind the same engine calls.
- Google Fonts are loaded from their CDN. Self-host them if the deployment has strict privacy or offline requirements.

## Deployment

Set `WEB_ORIGIN` on the server to the deployed web origin and `NEXT_PUBLIC_SERVER_URL` on the web deployment to the public Socket.IO server. Health checks can use `GET /health`.

Server container example:

```bash
docker build -f apps/server/Dockerfile -t snap-swap-server .
# Deploy apps/web to Vercel with NEXT_PUBLIC_SERVER_URL configured in the project.
```

The server currently keeps rooms in process memory, so deploy one server replica until a shared room adapter is added.
