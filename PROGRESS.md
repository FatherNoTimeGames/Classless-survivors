# Classless Survivors — progress

## Current state

- Completed: tasks 0–11, modular refactor 2a, and synergy pass 7a.
- Playable: keyboard/touch movement, automatic combat, XP/levels, 20 run-upgrade
  choices, five enemy types, elites, three guardians, a 15-minute campaign,
  victory/defeat, persistent rewards, free respec, saved builds, and replay.
- Task 11 adds **12 lasting temporary upgrades and one recovery fallback** to
  the original seven. Longblade extends melee; Familiars improves both pets;
  Lingering Venom strengthens new/refreshed Poison/curses. Viper Ink and Keen
  Instinct can introduce periodic damage and critical cadence during a run.
- New open synergies: any kills can heal; timed wards enable absorption-based
  physical retaliation; physical hits can apply Frost; crits pulse nearby DoTs;
  actual healing sends holy waves; slowed companion hits cause arcane bursts.
  These paths feed existing talents, marks, statuses, and family triggers.
- Offers check capabilities from talents OR acquired upgrades, avoiding unusable
  family choices while allowing run choices to open new paths. Selection also
  rejects forged/ineligible offers. No character-class restriction applies.
- Level 40 bounds temporary progression. The first 20 levels keep their previous
  XP curve; later thresholds grow quadratically. Second Wind offers healing and
  a temporary ward when fewer than three eligible lasting choices remain, so
  narrow/capped builds cannot trap queued rewards or gain unlimited lasting stats.
- Temporary proc state, eligibility, timers, event handlers, tuning, and pure
  ability descriptions have focused modules. Effects share the talent FIFO,
  ancestry, depth, and work limits, with additional cooldowns and target caps.
  Periodic pulses never crit/refresh. Pack Link rules and shot snapshots remain;
  Viper Ink explicitly gives companions Poison without Pack Link.
- Expanded imp range exposed a travel edge: shots from a trailing imp could
  expire before their selected aim. Shared bolt lifetime now covers aim distance
  while retaining the existing minimum lifetime and projectile budget.
- Live summaries, choice-screen details, and results show derived damage, range,
  critical/attack cadence, and companion inheritance. Trigger summaries show
  current values; full upgrade descriptions remain readable on touch. Keyboard
  focus includes the expandable summary and remains trapped within level choices.
- All 36 talents function across six freely mixed branches. Thirty start unlocked;
  research opens six capstones. Visual prerequisites, tooltips, cascading refunds,
  original icons, and free between-run respecs remain. See SYNERGY_AUDIT.md.
- Guardians arrive at 4:00, 9:00, and 14:00; all three must fall before dawn at
  15:00. Health death or remaining guardians at the deadline lose the run.
  Arrivals clear old threats without kill credit and use safe positions/grace.
  Controlled adds preserve on-kill builds. Kills heal 25% max HP and give 5s respite.
  Bosses retain shared statuses/DoTs; Resolve bounds repeated stuns/roots.
- Both endings freeze combat/choices, show final builds, save one-time rewards,
  and offer replay or build planning. A final-tick guardian kill precedes hostile
  impacts; dead runs cannot become victories. Pauses/level choices stop the clock.
- Permanent progression starts at 8 points/2 insight; completed runs 2/5 grant
  points 9/10. Research costs 1 insight per capstone; bounded rewards include early
  losses. No permanent stat purchases. Three named slots, autosaved drafts,
  version-2 validated saves, migration/recovery, and reviewed backups remain.
  Durable run identities prevent duplicate rewards. Unfinished combat is discarded
  on reload; completed progress/builds persist. No save-format change was needed.
- Original normal waves, safe spawns, readable warnings, elites, spatial queries,
  and entity/effect caps remain. Art reuses inexpensive original procedural shapes;
  no dependencies, backend, accounts, external assets, or paid services were added.

## Standing requirements

- Complete one authorized task, validate, update this log, commit, report, and
  pause until **continue**. Make ordinary design decisions independently.
- Keep focused modules, typed boundaries, and explicit state ownership. Simulation
  stays browser-independent; run.ts coordinates systems. See AGENTS.md and README.md.
- Prefer open talent triggers, explicit companion inheritance, and bounded effects.
  Descriptions must match behavior. No unnecessary frameworks/runtime dependencies.
- Reuse readable original art; fill missing cues with simple shapes/vectors/pixels.
  Detailed asset production is not required. Follow DEVELOPMENT_PLAN.md.

## Next task

**Task 12: Finish visual and audio presentation.**

Wait for **continue**. Audit readability across dense waves, the new hybrid effects,
upgrades, talent icons, guardian warnings and small screens. Reuse readable art;
fill only missing cues with inexpensive original procedural assets. Add restrained
procedural audio, volume/mute and reduced-motion support, respecting browser audio
activation rules. Keep settings, audio synthesis, and effect presentation separate
from simulation. Validate, document, commit, and pause. Broader device usability,
offline/PWA, and difficulty/performance balancing remain tasks 13–15.

## Latest validation

- Final `npm test`: **1,057 unit tests passed**, 16 files. Includes 25 expanded-
  upgrade cases, individual behavior/eligibility/inheritance/cadence/snapshot
  checks, fallback/queued-reward checks, maximum-range imp impacts, five hybrid
  guardian cases, five new full runs, and the expanded catalog interaction sweep.
- The sweep covers **36 talents × 20 individual upgrade states plus all-maximum
  states** (756 cases) for determinism, finite state, attribution/proc boundaries,
  and entity/effect caps. Existing progression, boss, save and talent checks pass.
- Five legal eight-point seeded routes—retaliation, Frost/melee, critical/DoT,
  healing/offense, summons—complete all **900 seconds** and defeat all guardians
  with real spawns, movement, XP, choices and upgrades. Each still earns choices
  beyond ten minutes; no injected health/damage/ranks/timeline jumps and no dropped
  effects. The two existing Mage/Priest full routes also pass. Seeded winnability
  does not establish comprehensive balance or human playtest quality.
- `npm run build`: TypeScript and production build passed. Output: approximately
  **109.84 kB JS (36.39 kB gzip), 11.15 kB CSS, 10.61 kB HTML**.
- Full Chromium suite: **47/47 passed** across desktop, tablet, and Android
  portrait emulation. The final summary refinement also passed all **6 targeted
  leveling/upgrade cases** across those viewports against the rebuilt app.
- New browser checks allocate a real Warrior/Hunter/Priest build, earn family
  upgrades/Wintersteel/Winter Pact, inspect changed abilities and descriptions,
  verify eligibility, and reload to confirm temporary powers reset. Existing
  full victory/rewards/respec/reload/replay and defeat/save/touch journeys pass.
  Keyboard tests exercise the summary and modal focus loop. Test pilots now choose
  valid new offers if their old preferred pool is capped instead of hanging.
- Browser full-run/power journeys accelerate only RAF timestamps (12×) and send
  movement keys based on visible HUD time; they never inject combat state. These
  are functional checks, not real-time performance or physical-device benchmarks.
- Reviewed desktop/tablet/phone summary screenshots: derived values, descriptions,
  controls and game remain readable without horizontal overflow. Details remain
  collapsed during normal combat. Physical hardware and other engines unverified.
- **88 TypeScript source modules; no runtime import cycles**. Node 24.19.0,
  npm 11.9.0, Chromium 154 and existing setup work; no environment changes needed.

## Remaining work and limits

- Tasks 12–17: presentation/audio; device usability; offline/PWA; difficulty and
  full-run performance; release regressions; production delivery/deployment.
- Later upgrade pacing and seeded build viability now work, but challenge and
  reward tuning still need task 15. Late scripted runs can become very strong;
  these victories are not a claim that all builds/seeds are balanced or equally fun.
- XP/effect density, distinction between overlapping hybrid effects, reduced motion
  and audio need the presentation pass. No physical Android/tablet or other engine
  performance claim is made; previous Node microbenchmarks excluded rendering.
- Combat runs are not restored after closure/reload. Clearing data or changing
  browser/device/origin needs an exported backup. Failed writes require exporting
  in-memory progress. Scenery is decorative; boundaries are solid.
- No offline installation or configured deployment yet. No unresolved failing
  checks or setup blockers remain.

## Milestone history

- Task 0: `90daca7`; task 1: `8332fcb`; task 2: `50cee85`.
- Modularity/art requirements: `93558f1`; refactor 2a: `851082a`.
- Task 3: leveling/run upgrades, `c10a1b7`; task 4: tree/framework, `4462fd4`.
- Task 5: Warrior/Mage, `d9eb89a`; task 6: Rogue/Hunter, `c2c7237`.
- Task 7: Priest/Warlock and all 36 talents, `b20621d`; synergy pass 7a: `69b8928`.
- Task 8: permanent progression, `5af9114`; task 9: enemies/waves, `19e3dce`.
- Task 10: timed campaign/guardians/victory, `d9ea3a4`.
- Task 11: expanded temporary upgrades, open hybrid paths, late progression,
  ability summaries and regression routes (this milestone).
