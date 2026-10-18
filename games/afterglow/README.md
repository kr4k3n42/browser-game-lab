# Afterglow

A surreal first-person exploration game: start in a bedroom, interact with a jar of fictional psychedelic mushrooms, recover three memories in each of three mazes, and return home to finish the story. Created with Fred through AI-assisted iteration.

## Wyatt: continue from another computer

Fork this repository on GitHub if you do not have write access. Clone your fork (or this repository if you have access):

```sh
git clone https://github.com/kr4k3n42/browser-game-lab.git
cd browser-game-lab
npm ci
npm run dev
```

Use Node.js 24. Open the local address printed by Vite, then choose Afterglow, or visit `/games/afterglow/`. Create a branch for your changes and open a pull request back to this repository. Read the root CONTRIBUTING.md and docs/creative-preferences.md before making changes.

The complete game is **index.html** in this directory: HTML interface, CSS, procedural textures, voxel models, story data, renderer, and gameplay. There are no external art assets, runtime dependencies, or build requirements for the game itself. You can also open that file directly, or serve this directory with `python -m http.server 8765` and open http://localhost:8765. Browser saves are local to each browser and origin; they do not sync between computers.

## Current playable state

- Three connected mazes, nine memories, bedroom returns, and an ending.
- Solid, textured block objects with collision and visible sides.
- 100 character units = 182.88 cm (6 feet); eye level 93 units; each tile 50 units; walls 140 units. Object width, depth, height, and baseHeight drive geometry and collision.
- Real-size furniture, a separate jar/table, letter/desk, and memories/plinths.
- Saved progress, journal, map, keyboard, mouse and touch controls, optional ambient audio.
- Horizontal FOV defaults to 90°, adjustable from 60° to 110°. A slow 14-second breathing effect grows from ±0.45° to ±0.9° to ±1.5° through the layers. Gentler motion disables it. The FOV preference is saved separately from progress.

## Where to change things

Search within index.html for:

| Area | Entry points |
| --- | --- |
| Story and memories | `story`, `interact`, `openJournal` |
| Maze layout and layers | `buildMaze`, `loadWorld`, `themes` |
| Bedroom | `loadRoom` |
| Real dimensions (centimeters) | `objectSizes`, `makeObject` |
| Block models | `voxelModel`, `worldBlocks` |
| Collision | `objectBox`, `canMove`, `move` |
| Projection and FOV | `cameraPlane`, `focalLength`, `advanceFov`, `drawScene` |
| Progress and storage | `save`, `getSave`, `begin` |
| Player controls | keyboard and pointer listeners near the end |

Keep floor, walls, and props on the same projection. Add objects through makeObject so explicit dimensions remain active. Keep clues reachable after changing collision footprints. Maintain old-save compatibility when changing state. Further layers require extending theme/story data and progression assumptions currently written for three chapters.

## Verification

From the repository root:

```sh
node games/afterglow/tests/check-game.cjs
node games/afterglow/tests/check-voxels.cjs
node games/afterglow/tests/check-scale.cjs
node games/afterglow/tests/check-fov.cjs
npm run build
```

The dependency-free Node checks exercise story progression, maze access, collision, geometry depth, physical scale, and FOV behavior. They use a mock browser environment; also play the game on desktop and mobile after visual changes. Confirm that all memories remain accessible and the ending still works.

## Hosting and collaboration

The existing repository build includes this game at `games/afterglow/index.html`. The repository's GitHub Pages workflow publishes main when configured. The original private Sites version is https://afterglow-labyrinth-fred.kr4k3n.chatgpt.site; this GitHub copy is independent and changes here do not automatically update that original site.

All graphics and audio are generated in the game code. No account credentials, private hosting configuration, chat transcripts, or generated scratch images are needed. This repository currently has no LICENSE file; public visibility permits reading and forking on GitHub but is not an explicit open-source license. Agree with Fred before redistributing it under another license.
