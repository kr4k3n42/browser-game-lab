# First Light

First Light is the first playable prototype in Browser Game Lab. It is intentionally small: the goal is to validate the shared browser pipeline before committing to a larger game concept.

## Current experience

- Orbit camera
- Dynamic warm beacon light
- Emissive materials and glow
- Animated atmosphere
- WebGPU-first engine creation with browser fallback

## Deep-game boundary

This directory is allowed to become a complete, deeply developed game. Shared code should be pulled into `packages/` only when the same problem appears in another game.

## Forking

To riff on this game, create a branch or fork and keep the game-specific decisions in this directory. The root README and `docs/` explain the shared conventions; this README is the source of truth for First Light itself.
