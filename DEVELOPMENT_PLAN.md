# Classless Survivors — development tasks

## Working agreement

Complete one numbered task per user-authorized work cycle. After completing it,
run its checks, commit it, update PROGRESS.md, report what finished and any known
issues, and wait for the user to say **continue**. This usage-control instruction
takes precedence over the project brief's request to continue automatically.
Do not start the next task in the same cycle. Make ordinary design and technical
decisions independently. If a task exceeds a cycle's limits, preserve unfinished
work and record exact resumption steps; do not mark it complete.

This list is implementation order. Each task builds on completed tasks. Fix
regressions caused by the current task before marking it complete. Any newly
discovered substantial work must be recorded explicitly, with its effect on the
remaining plan. Never silently drop a requirement.

## Product and technical direction

- A single-player dark fantasy survival game, with a complete run targeting 15
  minutes and three boss encounters. Victory and defeat return to build planning.
- TypeScript, HTML5 Canvas for the arena, accessible HTML/CSS for menus, and Vite
  for local development and production builds. Keep runtime dependencies small.
- Keyboard and touch movement; automatic combat. Portrait-first layout that also
  supports tablets and desktop. Use the easiest original programmatic art to
  produce: simple Canvas shapes, SVG/vector art, or limited-palette/monochrome
  pixel art. Readability takes priority over detail; pixel art is not mandatory.
- Six talent branches, six meaningful talents each: Warrior, Mage, Rogue, Priest,
  Warlock, and Hunter. Branches are freely mixable categories, never classes.
- Permanent unlocks broaden options within a bounded talent budget. Free respecs
  and saved builds encourage experimentation. Run upgrades are separate and reset.
- Local versioned saves, static hosting, offline caching, and an installable PWA
  where supported. No accounts, backend, paid services, or external gameplay APIs.
- Separate testable simulation/progression logic from rendering and input. Use
  seeded randomness for repeatable checks. Add meaningful automated tests as each
  system appears and browser tests for the user journey.
- Modularity is a standing requirement: focused modules, explicit typed boundaries,
  clear state ownership, and easy-to-find content/tuning. Separate gameplay systems
  as they grow; do not expand the current run.ts into a monolithic combat engine.
  Keep UI, rendering, input, simulation, and persistence independent. Prefer simple
  composition over extra frameworks. See AGENTS.md for implementation guidance.

The user's later specifications make maintainable modular code and minimal-effort,
readable art explicit priorities. Talent design should be as open and synergistic
as practical across branches, damage schools, weapons, and companion builds;
use explicit attribution and proc bounds rather than unnecessary source restrictions.
Reuse readable existing artwork; detailed asset production is not a completion requirement.

Detailed mechanics and tuning may change based on playtesting while preserving
these requirements. No subscription-usage or completion-time estimates are implied.

## Checklist and acceptance checks

- [x] **0. Inspect the repository and establish the task list.**
  Inspect existing instructions and files; save this plan and the progress log.
  Done when the implementation sequence and completion checks are committed.

- [x] **1. Establish the web project and validation tools.**
  Add the TypeScript/Vite application, responsive page shell, development/build
  commands, test runner, and browser-test tooling. Document local startup.
  Done when a clean install, type check, production build, meaningful initial
  test, and browser rendering check pass.

- [x] **2. Build the smallest playable survival loop.**
  Add a bounded arena, frame-rate-independent movement, keyboard and virtual-stick
  controls, one enemy, an automatic attack, health, XP pickups, and defeat/restart.
  Done when a player can move, kill enemies, collect XP, die, and restart;
  automated checks cover movement, hits, and run-state resets.

- [x] **2a. Refactor the foundation into focused simulation modules.**
  Completed as a separately requested task before leveling. Separate state,
  tuning, movement, spawning, combat, pickups, feedback, geometry, and randomness;
  keep run.ts as the coordinator. Existing regression checks pass, and a one-time
  comparison matched 244 original full-state checkpoints across four seeded routes.

- [x] **3. Add leveling and randomized run upgrades.**
  Extend the focused simulation modules with separate progression logic while
  preserving existing behavior and tests. The preparatory extraction is complete.
  Implement XP thresholds, paused upgrade selection, a useful initial upgrade
  pool, rarity/eligibility rules, and visible ability improvements.
  Done when successive levels offer valid choices, selections change combat,
  excessive XP is handled correctly, and a new run clears temporary upgrades.
  Delivered seven upgrades, queued rewards, weighted/eligible offers, a finite
  level-20 cap, accessible keyboard/touch selection, and visible combat changes.

- [x] **4. Build the classless talent framework and visual tree.**
  Define all 36 talents, prerequisites, descriptions, and cross-branch interactions.
  Implement bounded point allocation, refunds/free respecs, selection validation,
  touch-friendly tooltips, and the combat event/effect framework. Expose only
  implemented talents as usable; definitions alone do not count as completed content.
  Done when mixed-branch allocation works, invalid builds are rejected, and
  prerequisites, refunds, and bounded effect-trigger chains are tested.
  Delivered all 36 designs, seven functioning/selectable foundation talents,
  three-point mixed builds, connected branch graphs, touch/keyboard inspection,
  cascading refunds, free respec, and bounded typed effect processing. The other
  29 nodes are explicitly unavailable previews, to be implemented in tasks 5–7.

- [x] **5. Implement Warrior and Mage talents.**
  Deliver six working talents per branch, melee and elemental attacks, frost/
  physical interactions, shields or retaliation, icons, and accurate tooltips.
  Done when every talent has a behavior test and melee/caster hybrids visibly
  play differently from either branch alone.
  Delivered all twelve Warrior/Mage talents, shared cleave/projectile/status/shield
  systems, six-point builds, readable icons/effects, and tests for each talent,
  hybrid Frost consumption, shield lifecycles, attribution, and bounded dense combat.

- [x] **6. Implement Rogue and Hunter talents.**
  Deliver six working talents per branch, critical-hit and damage-over-time
  interactions, ranged attacks, and a summon with defined inheritance rules.
  Done when all twelve talents function and tests cover critical propagation,
  summon ownership/inheritance, targeting, and interactions with existing branches.
  Delivered all twelve talents, open non-periodic hit rules, shared critical cadence,
  generic DoT state/ticks/spreading, falcon ownership/inheritance, snare/Frost roots,
  and Wild Hunt commands. Eight temporary points allow a full branch plus a support
  pair. Tests include lethal spreading, natural expiration, Priest/Mage/Warrior
  hybrids, snapshots, cooldowns, and deterministic dense builds.

- [x] **7. Implement Priest and Warlock talents.**
  Deliver six working talents per branch, healing-to-offense effects, curses,
  damage-over-time detonations, and further summon/defensive synergies.
  Done when all 36 talents function, descriptions match behavior, and tests cover
  overhealing rules, damage attribution, detonations, and recursive-trigger limits.
  Delivered all 36 functioning talents. Added excess-healing wards, collection
  healing, holy marks, absorption offense, open curses, shared imp/falcon mechanics,
  periodic detonations, and healing/DoT companion synergies. Bounded trigger tests
  cover dense builds, lethal snapshots, actual vs excess healing, and effect cycles.

- [x] **7a. Audit talent synergies against the initial run upgrades.**
  Separately requested before task 8. Share haste, projectile volleys, and attack
  refunds; open compatible physical/fire triggers; preserve companion ownership
  and delayed proc ancestry. Test every talent against each upgrade plus maximum
  ranks, focused cross-branch behavior, and dense hybrid routes. Record the review
  in SYNERGY_AUDIT.md. This does not replace task 11's expanded upgrade content.

- [x] **8. Add persistent progression and saved character builds.**
  Implement run rewards, bounded talent-point progression, option unlocks, multiple
  named build slots, and free between-run respecs. Add versioned local saves,
  validation/migrations, recovery from invalid data, and export/import backups.
  Done when rewards cannot be claimed twice, early losses cannot trap progression,
  reloads retain unlocks/builds, and incompatible or damaged saves fail gracefully.
  Delivered eight starting points, two earned points (runs 2/5), insight research
  for six capstones, three named build slots, and free respecs. Added a versioned
  local profile with migration, independent build repair, previous-save recovery,
  storage-failure handling, reviewed backup import/export, and durable run identities
  consumed with rewards. Reloads discard unfinished combat without rewarding it.
  Unit/browser checks cover reloads, invalid data, migrations, earned larger builds,
  real defeat rewards, repeat-reward prevention, and disabled storage.

- [x] **9. Expand enemy variety, elites, and wave pacing.**
  Add distinct pursuers, ranged attackers, chargers, and area-denial enemies,
  elite modifiers, spawn pacing, and readable attack warnings. Use appropriate
  spatial queries/entity caps to support dense waves.
  Done when behavior tests pass and mixed waves create distinct positioning
  decisions without spawning unavoidable hits on the player.
  Delivered five enemy types, swift/stout elites, nine authored threat stages,
  fixed-aim warnings, arrows/charges/blight, status interruptions, elite XP, and
  bounded hostile effects. Added focused state/movement/intent/attack modules,
  separate renderers, a wave HUD/field guide, and a transient spatial grid for
  projectile sweeps/blasts. Checks cover spawn/corner safety, dense mixed waves,
  three-minute hybrids, browser warnings, and existing progression/save journeys.

- [x] **10. Complete the timed run and boss encounters.**
  Add three bosses with distinct, telegraphed positioning mechanics across the
  15-minute run, including a final encounter. Implement victory, defeat, pause,
  result summaries, rewards, and return to build planning.
  Done when winning and losing both complete the progression loop, boss transitions
  and rewards are tested, and boss mechanics are exercised in the browser.
  Delivered a 15-minute campaign with guardians at 4/9/14 minutes, fixed warnings,
  positioning mechanics, controlled reinforcements, shared talent/status rules,
  bounded hard control, healing breaks, deadline defeat/victory, final builds,
  rewards, free respec, and replay. Two earned-upgrade hybrid simulations win;
  full win/save/respec/reload/replay journeys pass on all three browser viewports.
  Initial delivery left expanded upgrades, pacing, and broader balance to tasks 11/15.

- [x] **11. Deepen temporary upgrades and hybrid builds.**
  Expand run upgrades to support all ability families and add temporary cross-branch
  synergies. Provide readable build/ability summaries and sensible fallback offers
  for capped upgrades. Preserve viable options for narrow and mixed builds.
  Done when representative retaliation, frost/melee, critical/DoT, healing/offense,
  and summon builds each have tested, noticeably different play patterns.
  Delivered 20 choices (seven original, twelve new, one recovery fallback),
  capability-based offers, open hybrid triggers, family improvements, level-40
  late progression, bounded proc modules, and derived ability/build summaries.
  Five distinct eight-point earned-upgrade routes defeat all guardians and reach
  dawn with choices beyond ten minutes. Catalog, boss, inheritance, fallback,
  and browser checks pass. Difficulty tuning remains task 15.

- [ ] **12. Finish the visual and audio presentation.**
  Audit readability and fill missing visuals using the simplest original procedural
  shapes, vectors, or pixel art. Reuse visuals that already work. Ensure distinct
  player/enemy silhouettes, talent/ability icons, boss warnings, and effects.
  Add restrained hit feedback, procedural audio, volume/mute, and reduced-motion
  support. Prioritize readability during dense combat and on small screens.
  Done when gameplay has a consistent, readable style, all content has the visual
  cues it needs, and audio activation/settings work under browser restrictions.
  Elaborate artwork or replacing readable simple art is not required.

- [ ] **13. Harden mobile, tablet, and desktop usability.**
  Tune portrait HUD, thumb reach, safe areas, touch targets, tooltips, and upgrade
  menus. Handle resizing, orientation, focus loss, and page visibility correctly;
  prevent touch controls from triggering browser gestures during play.
  Done when keyboard and simulated touch journeys pass across phone/tablet/desktop
  viewports and controls recover correctly after interruptions. Record any physical
  Android-device validation that cannot be performed here as an explicit limitation.

- [ ] **14. Add and verify offline installation.**
  Add the app manifest, original install icons, production service worker, cache
  versioning, and safe update behavior. Cache all required gameplay assets locally.
  Done when the built game loads and completes its core journey with networking
  disabled after initial loading, saves survive relaunches, and cache upgrades do
  not delete player progress. Document browser-specific installation limitations.

- [ ] **15. Balance builds and optimize full runs.**
  Playtest full-length runs and use repeatable simulation checks to tune difficulty,
  rewards, upgrade offers, and representative hybrids. Profile dense waves and
  optimize measured bottlenecks; bound particles, projectiles, and chained effects.
  Done when early progression is fair, several hybrids can complete a run, and
  measured performance is documented with workload and test-environment limits.
  Do not claim Android hardware performance from desktop emulation alone.

- [ ] **16. Complete regression testing and fix release blockers.**
  Exercise all completion criteria: mixed build, combat, leveling, different enemies
  and bosses, win/loss, rewards, respec, replay, browser closure/reopen, and offline
  return. Test every talent, representative cross-branch pairs, and high-risk effect
  combinations. Check save migration, long-run stability, and repeated restarts.
  Done when required checks pass, reported failures are diagnosed/fixed, and remaining
  limitations are explicit. No unused or inert talent may be called complete.

- [ ] **17. Prepare and deliver the playable release.**
  Produce and smoke-test the production build. Finish instructions for playing,
  development, checks, saves/backups, controls, static deployment, and PWA updates.
  Deploy if a suitable authorized deployment target is available; otherwise provide
  the verified build and exact remaining hosting step, including HTTPS requirements.
  Done when delivery evidence and known limitations are documented and committed.

## Completion standard

Each task reports checks actually executed, their outcomes, and any limits. Tests
that run zero cases or merely verify an implementation constant do not establish
readiness. Later polish does not excuse broken earlier functionality. Intermediate
playable builds are milestones, not claims that the whole game is finished.

The finished game must satisfy all nine user completion criteria, run without a
backend, retain progress after browser restarts, and support offline gameplay after
initial caching. Commit completed tasks locally; pushing and production publication
are distinct actions and must be reported accurately.
