# Design Decisions

## 2026-10-03 — Independent games inside one studio repository

We are starting with a monorepo so the shared workflow, deployment, documentation, and proven utilities are easy to reuse. Each game still owns its identity and can be developed deeply inside its own directory.

Shared code is intentionally conservative: a system moves into `packages/` only after more than one game needs it. This protects game-specific experimentation and makes later extraction or forking straightforward.

## 2026-10-03 — Babylon.js as the initial engine

Babylon.js is the initial browser engine because it provides a broad set of integrated game systems while supporting WebGPU and WebGL fallback. The project remains organized so a future game could use another renderer if that is the better creative choice.
