# Grid

A real-time collaborative estimation tool where team members vote on a 3x3 Fibonacci grid by clicking anywhere on a cell. Each participant gets a randomly assigned emoji from a shared category, votes are revealed after a 5-second countdown, and results are summarised instantly.

## Features

- **Room-based sessions** — create a board, share the 6-character URL with your team
- **Emoji avatars** — each participant is assigned a random emoji from one category (animals, faces, food, or fun objects)
- **Click-to-vote** — click anywhere on the grid; your emoji appears exactly where you clicked
- **5-second countdown** — admin starts voting, a progress bar counts down, then all votes are revealed
- **Live results** — vote summary shows which numbers got the most votes
- **Real-time sync** — all participants see updates instantly via server-sent events
- **Participant names** — set your name (persisted in localStorage), shown on emoji hover and in the sidebar legend

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router + Turbopack)
- [Turborepo](https://turbo.build/)
- [pnpm](https://pnpm.io/) workspaces
- Server-sent events for real-time updates
- In-memory store (no database required)

## Getting started

### Prerequisites

- Node.js 22+
- pnpm 10+

### Install & run

```sh
pnpm install
pnpm dev
```

The app runs at [http://localhost:3030](http://localhost:3030).

### Build

```sh
pnpm build
```

## How to use

1. Open [http://localhost:3030](http://localhost:3030)
2. Click **Create new board**
3. Share the URL (e.g. `http://localhost:3030/aB3xK9`) with your team
4. Each participant sets their name and gets a random emoji
5. The admin clicks **Start voting** — everyone has 5 seconds to click a cell
6. After the countdown, all emojis and a vote summary are revealed
7. Admin clicks **Start voting** again for the next round
