# Game Core

This package is reserved for systems that are genuinely useful across multiple games:

- Loading and performance instrumentation
- Shared input abstractions
- Accessibility and quality settings
- Save and settings persistence
- Reusable UI primitives

Game-specific mechanics should stay inside the game that owns them. A shared system belongs here only after it has proven useful in at least two games.
