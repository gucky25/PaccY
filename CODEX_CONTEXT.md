# Codex Context

Last updated: 2026-04-28

This file exists so a fresh Codex session on another computer can quickly understand what has already been done.

## Project Summary

PaccY is a dependency-free Pac-Man-inspired browser game. It runs directly from `index.html` and uses only HTML, CSS and JavaScript.

Current version: 1.0.0

GitHub repo: https://github.com/gucky25/PaccY

## What We Built

- Created a new standalone project folder named `PaccY`.
- Wrote `PLAN.md` before implementation with the intended build steps.
- Built the game in `index.html`, `styles.css` and `game.js`.
- Added multiple hand-authored maze levels.
- Added arrow-key movement, pause, restart and mute controls.
- Added pellets, power pellets, fruit bonuses, lives, score and high score.
- Added four ghosts with different target behavior.
- Added canvas-rendered neon arcade visuals.
- Added procedural music and sound effects via the Web Audio API.
- Added `README.md`, `VERSION` and `CHANGELOG.md`.
- Initialized a Git repository on branch `main`.
- Created the public GitHub repository under account `gucky25`.
- Pushed the initial release to GitHub.

## How To Run

Open `index.html` in a browser. No install or build step is needed.

Controls:

- Arrow keys: move
- Space: pause/resume
- R: restart
- M: mute/unmute

Audio starts after the first click or key press because browsers require user interaction before playing sound.

## Repo State At Handoff

- Branch: `main`
- Remote: `origin` -> `https://github.com/gucky25/PaccY.git`
- Initial release commit: `b373824` (`Release PaccY 1.0.0`)
- The project is intentionally dependency-free.

## Verification Already Done

- Ran `node --check game.js`.
- Ran a small DOM-stub load test so the initial game setup and level validation executed.
- Confirmed the local repo was clean after the first push.

## Notes For Future Codex Sessions

- Keep the project dependency-free unless the user explicitly asks otherwise.
- Prefer editing the existing vanilla HTML/CSS/JS files instead of adding a framework.
- If adding features, update `CHANGELOG.md`, `VERSION` when appropriate, and this context file.
- If pushing from a new computer, clone with:

```powershell
git clone https://github.com/gucky25/PaccY.git
```

Then work inside the cloned `PaccY` folder.
