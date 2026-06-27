# SnapSwap PRD

## Overview

SnapSwap is a real-time multiplayer card-matching party game played online with friends.

Players join a room using a room code, receive cards, and race simultaneously to complete matching sets by exchanging cards through a shared market.

The game is inspired by physical card games commonly played in groups but redesigned for online multiplayer.

Unlike traditional turn-based card games, all players act simultaneously.

Speed, pattern recognition, and decision making determine the winner.

---

# Vision

Create a fast, social, highly replayable multiplayer game that can support multiple themed card packs.

Examples:

* Fashion Pack
* Fruits Pack
* Animals Pack
* Food Pack
* Sports Pack
* Seasonal Packs
* Community Packs

The game engine should be theme-agnostic.

Cards are data.

Gameplay remains unchanged.

---

# Core Gameplay

## Players

Minimum: 2

Maximum: 6

Recommended: 4–6

---

## Room Flow

1. Host creates room.
2. Room code generated.
3. Players join room.
4. Host presses Start Game.
5. Game begins.

---

## Card Distribution

Each player receives:

* 12 cards total

Organized into:

* Group A (4 cards)
* Group B (4 cards)
* Group C (4 cards)

The center market contains:

* 6 face-up cards

---

## Active Group Rule

Players may only interact with one group at a time.

Only one group can be active/open.

Players can switch active groups whenever they choose.

---

## Swap Flow

Player:

1. Selects one card from active group.
2. Selects one card from center market.

Server:

1. Validates swap.
2. Executes swap.
3. Updates market.
4. Broadcasts state.

All swaps are server-authoritative.

---

## Race Conditions

Multiple players may attempt to claim the same market card.

The first valid server request wins.

All other requests fail.

Example:

Player A and Player B both target Blue Pants.

Server receives A first.

A succeeds.

B receives:

"Card already taken."

---

## Winning

A group is complete when all 4 cards match.

Example:

Group A

* Blue Pants
* Blue Pants
* Blue Pants
* Blue Pants

Completed.

A player wins when:

* Group A complete
* Group B complete
* Group C complete

First player to satisfy all conditions wins.

---

# Card Model

Cards belong to a Pack.

Example:

Fashion Pack:

```ts
{
  id: "card_1",
  category: "pants",
  color: "blue"
}
```

Fruit Pack:

```ts
{
  id: "card_2",
  fruit: "banana"
}
```

The engine should not depend on specific themes.

Matching logic should use a configurable property.

---

# V1 Scope

## Landing

* Create room
* Join room
* Player name input

---

## Lobby

* Player list
* Room code
* Copy room code
* Host controls
* Start game

---

## Gameplay

### Top Bar

* Room code
* Player count
* Connection status

### Market

* 6 shared cards

### Player Area

* 3 groups
* Active group selector
* Selected card state

### Activity Feed

Examples:

* John completed Group 1
* Sarah grabbed Blue Pants
* Mike joined room

### Progress Indicators

Show completion status for:

* Group A
* Group B
* Group C

---

## End Game

* Winner
* Rankings
* Play Again

---

# UX Rules

Use click-to-swap.

Never use drag-and-drop.

Flow:

1. Select player card.
2. Select market card.
3. Swap executes.

Mobile must be first-class.

Desktop and mobile should share gameplay behavior.

---

# Technical Architecture

## Monorepo

```txt
apps/
  web
  server

packages/
  shared
  ui
```

---

## Web

Framework:

* Next.js latest
* App Router
* TypeScript

Responsibilities:

* UI rendering
* User interaction
* Socket connection

Never owns game state.

---

## Server

Framework:

* Node.js
* Socket.IO
* TypeScript

Responsibilities:

* Rooms
* Players
* Game lifecycle
* State broadcasting
* Validation

---

## Shared

Contains:

* Game engine
* Types
* Constants
* Schemas

Must remain framework-independent.

No React.

No Next.js.

No Socket.IO.

Pure TypeScript only.

---

## UI Package

Contains:

* Design tokens
* Components
* Shared styles

Used by web application.

---

# State Authority

Server owns:

* Room state
* Card state
* Market state
* Winner detection

Clients own:

* Local UI state
* Selected card state
* Visual effects

Never calculate winner on client.

---

# Deployment

Frontend:

* Vercel

Backend:

* Railway

Persistence:

* None required for V1

In-memory state is acceptable.

---

# Definition Of Done

V1 is complete when:

* Players can create rooms.
* Players can join rooms.
* Host can start game.
* Cards are dealt correctly.
* Market contains 6 cards.
* Swaps work.
* Race conditions work.
* Winner detection works.
* Game over screen works.
* Mobile layout works.
* Build passes.
* Typecheck passes.
* Tests pass.

At that point SnapSwap is playable by real users.
