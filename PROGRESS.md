# Classless Survivors — progress

## Current state

- Completed: tasks 0–1, planning and the web project/validation foundation.
- Repository began empty, with no project code or existing agent instructions.
- Implemented: responsive TypeScript/Vite page shell, original static Canvas
  sanctuary artwork, bounded screen-density rendering, and accessible navigation.
- Toolchain validated with Node 24.19.0, npm 11.9.0, and system Chromium 154.
- There is no playable survival loop yet; that is task 2.
- Plan: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md).

## Next task

**Task 2: Build the smallest playable survival loop.**

Wait for the user to say **continue**, then implement only task 2: bounded arena,
frame-rate-independent keyboard/virtual-stick movement, one enemy, automatic
attack, health, XP pickups, and defeat/restart. Keep simulation separate from
rendering/input. Test movement, hits, and reset behavior; exercise real browser
play and simulated touch. Do not add the leveling/upgrade system from task 3 yet.
Update this log, mark completion after passing checks, commit, report, and pause.

## Remaining work

Tasks 2–17 in the development plan: playable foundation; leveling; classless talent
framework; all six branches; persistence; enemy/boss variety; temporary synergies;
presentation; device usability; offline/PWA; balancing; regression fixes; release.

## Validation and known issues

- Task 1: clean `npm ci` passed using the committed dependency lockfile.
- `npm test`: 14 viewport-fitting checks passed, including aspect preservation,
  letterboxing, dense-screen memory bounds, and invalid/hidden surface handling.
- `npm run build`: TypeScript checks and production build passed. Current output
  is approximately 3.16 kB JavaScript and 2.48 kB CSS before compression.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`:
  3 production-browser checks passed (desktop, tablet, Android portrait emulation).
  Verified nonempty scene pixels, backing-buffer sizing, resize redraw, no
  horizontal overflow down to 280px width, skip-link focus, no page/console errors,
  and no external asset requests. Reviewed phone and desktop screenshots.
- Started `npm run dev -- --host 127.0.0.1` and fetched both the page and transformed
  TypeScript entry successfully. Stopped the temporary server afterward. Browser
  checks also started and stopped their own production preview server.
- Run instructions are in README.md. Chromium is already installed in this cloud
  instance; set the executable-path variable above for browser checks. Other
  machines can use the documented Playwright browser installation instead.
- Task 1 milestone commit: `feat: establish web foundation and validation tools`.
- Gameplay, saves, touch movement, offline behavior, and other browser engines
  have not been implemented or validated; later tasks cover them.
- No deployment target is configured or verified. Determine available hosting at
  release time; do not let that block local development.
- Physical Android/tablet testing may require hardware unavailable in this cloud
  environment. Browser emulation and device testing must be reported separately.
- No current implementation blockers. Task 1 has no known failing checks.

## Completion report convention

For each task record the finished behavior, validation outcomes, known issues,
commit, and next task. Stop after each completed task until **continue**. If
interrupted, record partial changes, failing checks, and exact next steps here.
