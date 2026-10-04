# Contributing to Browser Game Lab

Browser Game Lab is designed for collaboration between people and AI tools.

## Before changing code

Read:

1. `README.md`
2. `docs/creative-preferences.md`
3. The README and design notes for the game being changed

## Scope rule

Keep game-specific changes inside that game's directory. Add something to
`packages/` only when it has proven useful in more than one game or when the
shared behavior is intentionally part of the studio system.

## Creative rule

Each game is allowed to become strange, ambitious, and deeply specific. Shared
conventions are defaults, not a reason to flatten the identity of a game.

## AI collaboration rule

Plain-language prompts are welcome. For substantial changes, record the intent
and the resulting decision in the relevant README or `docs/design-decisions.md`.
Prefer small playable increments so a human can judge the result in the browser.

## Forking rule

Forks should preserve the original game's README and add a short note explaining
what is being changed. A successful fork may eventually become a separate game,
while keeping its relationship to the original visible.

## Verification

Before merging a change:

```text
npm run build
```

For visual changes, open the affected game in a browser and check both desktop
and narrow-screen layouts when practical.
