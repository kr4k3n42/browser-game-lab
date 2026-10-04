# Perfect Pour

Perfect Pour is the second playable showcase in Browser Game Lab. It is a
single-mechanic service-shift game based on the Tipper concept in the Kraken
Obsidian vault: make a great beer pour while balancing speed, foam, and risk.

## Current experience

- Six escalating drink orders with different fill and foam targets
- Nonic pint-glass geometry with a rolled rim, shoulder ring, heavy base, and visible pint proportions
- Rush-hour rounds from order four onward with two simultaneous pints; switch between tickets while preserving each pour
- Hold-to-pour interaction with mouse, touch, or Space
- Flow control with a slider or Arrow keys
- Scoring, streaks, lives, tip values, and a persistent best score
- Procedural Babylon.js taproom, glass, liquid, foam, bubbles, bottles, lights,
  and synthesized feedback tones

## Creative boundary

This is deliberately a complete vertical slice rather than a promise of a
scientifically accurate fluid simulator. The liquid is a stylized game system.
The first three orders teach the single-pint loop; later rush-hour rounds add a
second glass and ticket so the player has to manage attention without changing
the core pour controls.

## Forking

Keep experiments specific to this directory until a system clearly proves
useful in another game. The game can be extracted into its own repository while
remaining playable from the Browser Game Lab hub.
