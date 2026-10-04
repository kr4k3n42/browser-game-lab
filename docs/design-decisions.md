# Design Decisions

## 2026-10-03 — Independent games inside one studio repository

We are starting with a monorepo so the shared workflow, deployment, documentation, and proven utilities are easy to reuse. Each game still owns its identity and can be developed deeply inside its own directory.

Shared code is intentionally conservative: a system moves into `packages/` only after more than one game needs it. This protects game-specific experimentation and makes later extraction or forking straightforward.

## 2026-10-03 — Babylon.js as the initial engine

Babylon.js is the initial browser engine because it provides a broad set of integrated game systems while supporting WebGPU and WebGL fallback. The project remains organized so a future game could use another renderer if that is the better creative choice.

## 2026-10-03 — Studio system inspired by the existing AYSO design-system repository

Fred's existing `ayso-design-system` repository demonstrates a strong pattern for
AI-assisted work: keep a canonical, versioned source of truth; write instructions
for both people and AI tools; and distinguish fixed foundations from flexible
context-specific expression. Browser Game Lab adopts that process pattern only.
It does not copy AYSO branding, assets, or content.
