# ROADSTER

Unofficial Rocket-inspired driving and flight prototype. Open `/games/roadster/` in the local Vite server. The preserved source-linked dossier is at `/games/roadster/dossier.html`.

- `specs.ts`: dated, variant-scoped claims and reported values, sources, historical exclusions and missing parameters. `vehicleProfiles` is configuration scaffolding, not calibrated physics.
- `main.ts`, `index.html`, `style.css`: playable cockpit, HUD, cameras, and drive → launch → land objective.
- `vehicle.ts`: original procedural angular single-seat car with ten visible vapor nozzles, moving wheels, and yoke.
- `track.ts`: desert runway, circuit, launch ramp, landing markers, and perimeter.
- `physics.ts`: simplified deterministic driving, whole-car suspension, and gas-limited flight.
- `dossier.*`: preserved research interface.

Controls: W forward, X reverse, S brake, A/D or left/right arrows steer (yaw in flight), Space lift, Shift boost, up/down arrows pitch, Q/E roll, C gas-limited leveling/descent assist. Hold thrust controls to fire; release to coast. V changes camera; R resets/refills; T refills when stopped on the ground; P/Escape pauses. Basic touch buttons are a fallback, not a complete mobile flight scheme.

Try a brief lift pulse, then hold C to cushion the landing. Gas exhaustion prevents assistance. A successful launch and landing completes the introduction and leaves free play.

The 2,000 kg mass, 1 MW power, 27 m/s² lift acceleration, and eight seconds of normalized full thrust are game-tuning assumptions, NOT verified Rocket specifications. Never use Standard mass as Rocket mass, infer thrust from tank volume alone, or mix 2017 concept claims with 2026 figures. Do not treat targets, estimates, or demo timing as independent certification.

Limitations: no sound, multiplayer, detailed tire model, or damage simulation. Buildings, signs, and bollards are decorative; ground, ramp, and perimeter affect motion. This is not Tesla CAD or a validated simulator. Run numerical checks with `node --experimental-strip-types games/roadster/physics.test.mjs`.

Research date: 2026-10-19. See the dossier for source links and conflicts. No proprietary images, Tesla logos, or external assets were copied. Still is unchanged.
