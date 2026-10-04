# Browser Game Lab

Browser Game Lab is a prompt-driven studio for creating polished, publicly playable web games.

The repository has two deliberate properties:

1. Games can share proven infrastructure.
2. Games can diverge deeply and remain independent.

The shared foundation is useful, but it is not a creative constraint. A game-specific decision takes priority over a studio convention, and shared abstractions are added only after they have proved useful across more than one game.

## Start here

```powershell
npm install
npm run dev
```

Open the local URL shown by Vite, then choose **First Light** from the hub.

## Repository map

- `games/` — independent game projects
- `packages/` — conservative shared systems
- `docs/` — preferences, collaboration rules, and decisions
- `.github/workflows/` — continuous deployment configuration

## Collaboration model

Describe ideas in plain language. The goal is to turn prompts into playable increments, keep game-specific work local to its game, and document decisions that should influence future projects.

## Public sharing

The root site is a small game hub. Individual games are separate entries under `games/`, so the hub can become a portfolio and each game can later be extracted, forked, or published independently.
