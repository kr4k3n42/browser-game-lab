---
title: Browser Game Lab Repository Architecture
description: Map of the repository and the responsibility of each layer.
version: 0.1.0
status: active
---

# Repository Architecture

## Purpose

Browser Game Lab is a small, human-readable operating context for building and
sharing browser games with AI. It is intentionally modular: shared guidance is
written once, while each game owns its own creative and technical direction.

## Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Studio context | `docs/` | Preferences, principles, workflows, and durable decisions |
| Independent games | `games/<game>/` | Game-specific design, code, assets, and experiments |
| Shared systems | `packages/` | Reuse that has proven valuable across games |
| Public hub | `src/`, `index.html` | Portfolio and entry point for public visitors |
| Automation | `.github/workflows/` | Build and deployment checks |

## Source-of-truth rules

1. A game-specific README or design document governs that game's identity.
2. `docs/creative-preferences.md` governs studio-wide preferences.
3. `packages/` contains only deliberate, reusable systems.
4. The current user prompt supplies the immediate intent and context.
5. Durable improvements should be recorded in a reviewable Markdown document.

## External context

Fred's private `skills` repository is the broader operating context for AI
collaboration. This repository applies only the parts useful to game creation:
modularity, semantic Markdown, explicit versioning, evidence-aware decisions, and
portable workflows. It does not copy private or unrelated material into this
public game repository.
