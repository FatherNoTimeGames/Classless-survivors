# Classless Survivors

A single-player dark fantasy survival roguelite built with TypeScript and Canvas.
Mix talents freely across six fantasy archetypes. No accounts or backend required.

**Current milestone:** complete Warrior, Mage, Rogue, and Hunter branches, with
critical hits, Poison spreading, companions, snares, Frost, shields, and retaliation.
The six-branch visual tree contains 36 talent designs; **27 are functioning and
selectable**. The other nine are coming-soon previews. Persistent saves, bosses,
and offline installation remain upcoming. See [the task list](DEVELOPMENT_PLAN.md)
and [progress log](PROGRESS.md).

## Play this milestone

Open **Talents** before a run. You have eight talent points, can mix any branches,
and may leave points unspent. Select a branch tab, then a node to inspect its
description, prerequisites, and suggested synergies. Hover/focus help and a
persistent detail panel support mouse, keyboard, and touch. Allocate a point,
refund individual talents, or use **Free respec** to clear the whole build.
Refunding a prerequisite also refunds dependent talents. Planned nodes remain
inspectable, with allocation disabled.

| Playable talent | Branch | Behavior |
| --- | --- | --- |
| Iron Reprisal | Warrior | Surviving contact health loss retaliates for 12 physical damage within 44 range |
| Sweeping Blade | Warrior | Auto-aim a 120° melee cleave within 50 range: 16 physical damage every 1.1s |
| Spellsteel | Warrior | Every third melee hit fires a triggered 12-damage ember from the victim at another foe within 120 range |
| Frostbreak | Warrior | Melee consumes Frost for 8 extra physical damage and a 0.6s stun |
| Iron Ward | Warrior | Surviving health loss grants an 8-point, 3s shield; 5s cooldown |
| Last Stand | Warrior | Enemy damage breaking a shield triggers 20 physical damage within 60 range |
| Arcane Echo | Mage | Every third direct ember hit strikes another nearby enemy for 9 arcane damage |
| Rime Sigil | Mage | Direct and triggered ember hits refresh 2s Frost, slowing enemies by 30% |
| Chain Spark | Mage | Every third arcane hit chains 10 lightning damage to a different foe within 96 range |
| Shatterglass | Mage | Physical hits consume Frost for a 10-damage arcane explosion within 36 range |
| Mana Ward | Mage | Every third triggered spell hit grants an 8-point shield for 3s |
| Riftweaver | Mage | Triggered spell hits refund 0.15s of ember/melee cooldown, at most once per second |
| Expose Weakness | Rogue | Non-periodic hits against wounded foes add 6 damage and refund 0.15s of automatic attack cooldowns |
| Venom Edge | Rogue | Non-periodic hits apply 3 Poison damage each second for 2s; refreshes do not delay ticks |
| Killer Instinct | Rogue | Every fourth non-periodic hit crits for 1.75× damage; all schools and companions share the cadence |
| Siphon Toxin | Rogue | Natural expiration of any DoT on a surviving foe heals 2; death is not expiration |
| Contagion | Rogue | Critical hits spread all active DoTs to the two nearest other foes within 60 range, including on lethal hits |
| Nightfall | Rogue | Critical kills cause one extra tick of all active DoTs within 60 range; no recursive critical ticks |
| Ember Communion | Priest | Every fourth direct ember kill restores 3 health |
| Searing Grace | Priest | Requires Communion; actual healing strikes the nearest foe within 110 range for 6 holy damage |
| Soul Cinder | Warlock | Every fourth direct ember kill bursts for 9 shadow damage within 36 range, without chaining |
| Hunting Momentum | Hunter | Any kill stores one additional target for the next ember volley with enough distinct targets |
| Falcon Companion | Hunter | A falcon strikes the nearest foe within 180 range for 8 physical damage each second; shares critical rules |
| Snaring Shot | Hunter | Every fourth non-periodic hit places a 2s snare within 36 range, slowing by 35%; at most eight zones |
| Pack Link | Hunter | Companions also inherit wound bonuses and talent-based Poison, Frost, snares, and roots |
| Frost Trap | Hunter | Hits against any slowed foe root for 0.75s and apply 2s Frost, with a 3s cooldown per foe |
| Wild Hunt | Hunter | Spending Momentum commands all companions to strike immediately, at most once per 2s |

Try **Iron Reprisal → Sweeping Blade → Frostbreak** alongside **Arcane Echo →
Rime Sigil → Shatterglass**: embers freeze foes, then a cleave consumes Frost for
bonus damage, a stun, and a burst. Both talents benefit from the same consumption,
including when the primary hit kills. Physical retaliation can also shatter Frost.
Allocate an entire six-point branch plus a two-point supporting pair, or mix paths.
Try **all Rogue talents + Hunting Momentum + Falcon Companion** for a shared
critical cadence that spreads Poison and pulses it on kills. Try **all Hunter
talents + Expose Weakness + Venom Edge** for a falcon that poisons wounded foes,
feeds snares, and roots them. **Hunting Momentum + Falcon + Pack Link + Arcane
Echo + Rime Sigil + Shatterglass** turns physical companion hits into Frost bursts.
Talent points are temporarily all available; bounded permanent unlocks arrive in task 8.

Spellsteel needs a melee ability to trigger. Its ember skips the original victim,
can apply Frost, and counts as a triggered spell; it cannot count as a direct ember
for Arcane Echo or direct-kill talents. It can apply Rogue wound bonuses, Poison,
and critical hits, like other non-periodic damage. Triggered spells include
nonphysical talent hits such as arcane echoes, lightning, holy healing attacks,
and shadow bursts. Shields refresh without stacking or weakening; they absorb
before health. Expiration never triggers Last Stand, and fully absorbed hits do
not trigger health-loss talents. Frost has ice prongs; stuns stop movement and
contact attacks. Cleaves use arcs, wards use an oval plus a health-line amount/timer,
and spell effects have distinct shapes. Overhealing and post-death effects cannot
resurrect the player. Talents remain separate from randomized run upgrades.

Rogue and Hunter use open hit rules: weapons, spells, blasts, and retaliation
qualify. Periodic damage cannot crit, reapply Poison, or generate hit-based snares;
periodic and companion kills still supply Momentum. Companions always share your
critical cadence and critical effects; Pack Link adds the listed noncritical
on-hit effects. Explicit ability-specific rules such as Arcane Echo still require
their described source. Roots stop movement but allow contact attacks; stuns stop
both. Slows use the strongest value rather than stacking. Poison can spread on
lethal hits, and Nightfall pulses those newly spread effects once. These rules
prevent recursive proc loops without limiting talents to one fantasy archetype.

Your chosen talents are copied into the new run. Editing is available before the
first run and after defeat; paused runs cannot be respecced. **Try again** uses
your current talent allocation but resets temporary upgrades. Builds currently
last only while this page remains open; local saves and slots arrive in task 8.

Choose **Enter the clearing** to begin. Move with **WASD** or **arrow keys**, or
press and drag anywhere in the arena to create a floating virtual stick (touch,
pen, or mouse). Release to stop. Keyboard movement works while the arena has
focus; click/tap it to refocus. The arena edge is solid; ruined scenery is visual.

Your ember fires automatically at nearby enemies. Green shards are XP: move
near them to attract and collect them. Ten XP earns the first level; each following
threshold costs eight more XP. On leveling, combat freezes while you select a
run upgrade. Tap/click a card, or use Tab and Enter/Space. Escape cannot dismiss a
level reward. If several levels are earned at once, choose once for each reward;
excess XP carries over. Held movement input is cleared before play resumes.

Each offer contains up to three distinct upgrades, with at least one weapon
option when available. Common upgrades appear from level 2, uncommon from level 3,
and rare from level 4. Common offers have greater selection weight. Maxed upgrades
stop appearing. The initial pool supports 20 levels; at maximum level, XP remains
counted in the run total and no more choices are required.

| Run upgrade | Effect per rank | Rank cap |
| --- | --- | --- |
| Quickened Ember | Ember cooldown −0.08 seconds | 4 |
| Fleetfoot | Movement speed +12 | 3 |
| Soul Gatherer | XP attraction range +18 | 3 |
| Living Ember | Maximum health +12; restore 12 health | 3 |
| Forked Ember | Attack one additional distinct nearby target, if available | 2 |
| Soul Needle | Each ember passes through one additional enemy | 2 |
| Ashburst | Direct hits explode for half damage; blast radius +20, without chaining | 2 |

Piercing bolts have a pale trail; explosive bolts produce expanding impact rings.
Open **Run upgrades** beneath the arena to inspect your ranks and ember stats.
Enemy numbers build over time, and you lose when health reaches zero. **Try again**
starts a fresh run with level 1, your chosen talents, and no run upgrades. There is no victory
condition or persistent progress in this milestone. Full enemy variety and balancing
remain later milestones; some weapon combinations can outpace the starter enemy.

Use **Pause** or **Escape** to pause and **Resume run** or **Escape** to resume.
Leaving the browser tab/window pauses the game automatically. After an input
interruption, release and press movement keys again to resume movement.

## Develop

Use Node **24.19.0 or later within Node 24** and npm **11 or later**. The exact
development runtime is pinned in `.node-version`; dependency versions are locked.

```sh
cd /workspace/Classless-survivors
npm ci
npm run dev
```

Vite serves development on port 5173. On your own machine, open
`http://localhost:5173`. Cloud access depends on your environment's port-forwarding
support. No environment variables, credentials, or external assets are required.

## Validate

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Browser installation is a one-time step. If Linux system libraries are missing,
use Playwright's documented `npx playwright install --with-deps chromium` setup
on a machine where you have system-package installation permission.

To use an existing Chromium instead of downloading one:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

After browser setup, `npm run check` runs unit tests, type checking, production
build, and production browser tests. Set the same executable-path variable for
that command when using a system browser. `npm run test:watch` watches unit tests.

Browser checks launch their own production preview server on port 4173 and fail
if that port is already occupied. They verify real canvas pixels, local asset
loading, resize behavior, keyboard navigation, combat through defeat/restart, and
no horizontal overflow at desktop, tablet, and Android-sized viewports. Real
browser touch dispatch tests on touch-enabled profiles cover virtual-stick
movement, multiple fingers, release/cancellation, and gesture suppression. The
simulation tests cover movement across frame rates, targeting, swept collision,
damage protection, XP, spawning, bounded entities, and reset behavior.
Progression checks also exercise queued levels, invalid/capped selections, rarity,
every upgrade's gameplay effect, piercing/explosion interactions, and maximum-level
completion. Browser leveling journeys navigate to actual rendered XP shards, verify
the frozen choice screen, select with keyboard/touch, inspect the improved ability,
earn a second level, and start a fresh run.
Talent tests cover all 27 functioning effects, mixed-branch synergies, valid
and invalid builds, prerequisites, cascading refunds, snapshots, and trigger
budgets/cycles. Browser checks inspect branch trees with keyboard/touch, enforce
the point limit, respec, and start a three-branch build. Additional browser journeys
allocate full Warrior/Mage branches and observe melee/ward drawing during combat.
Rogue/Hunter browser flows allocate complete branches with supports and observe
actual falcon, Poison, critical, snare, and Frost drawing. Unit tests verify each
new talent, curse-compatible expiration/spreading, attribution, critical cadence,
companion inheritance, tick timing, and allocation-order independence. Combat
feedback journeys fix the normal run seed for repeatability; they observe real
drawing and never inject internal game state.
Shared-system tests cover arc targeting, attribution, Frost consumption on lethal hits,
shield absorption/expiration, stuns, cooldown limits, and dense deterministic hybrids.
Screenshots and failure traces are
written to ignored `test-results/`. Emulation does not replace physical device
testing, and Chromium checks do not establish support in other browser engines.

## Production

```sh
npm run build
npm run preview
```

Preview serves the built app on port 4173. Deploy the contents of `dist/` to a
static web host. Asset URLs are relative to support subdirectory hosting. The
preview command is for local validation, not a production server. HTTPS and
offline installation guidance will be completed with the PWA milestone.

## Layout

- `src/main.ts`: browser initialization and canvas lifecycle.
- `src/game/`: deterministic simulation and fixed-timestep clock, without DOM APIs.
- `src/content/`: upgrade definitions, rank caps, rarity, and progression tuning.
- `src/ui/`: DOM helpers, HUD presentation, and accessible upgrade selection.
- `src/input/`: keyboard and captured-pointer movement controls.
- `src/rendering/`: canvas sizing and original procedural scene art.
- `src/styles.css` and `index.html`: responsive, semantic page shell.
- `tests/`: unit tests for logic independent of the browser.
- `e2e/`: browser checks against the production build.

The simulation module map:

| Responsibility | Module under `src/game/` |
| --- | --- |
| Tick order and defeated-run guard | `run.ts` |
| Entity types and fresh-run state | `state.ts` |
| Talent allocation, validation, and cascading refunds | `builds.ts` |
| Dimensions, timing, and gameplay tuning | `rules.ts` |
| Player movement, boundaries, and enemy pursuit | `movement.ts` |
| Spawn pacing and safe placement | `spawning.ts` |
| Targeting, cooldowns, projectile hits, and enemy contact | `combat.ts` |
| Shared enemy damage, kill credit, and death drops | `damage.ts` |
| Automatic directional melee arcs | `melee.ts` |
| Shared projectile creation and attribution snapshots | `projectiles.ts` |
| Frost/stun/root lifetimes, consumption, and status/cooldown timers | `statuses.ts` |
| Hit eligibility and companion inheritance | `hit-policy.ts` |
| Shared wound bonuses, Poison application, and critical cadence | `hit-modifiers.ts` |
| Nonstacking periodic state, refreshes, and snapshots | `dot-state.ts` |
| Periodic ticks, expiration events, and extra pulses | `damage-over-time.ts` |
| Snare placement, caps, aging, and occupancy | `snares.ts` |
| Run-owned companion targeting, cooldowns, and commands | `companions.ts` |
| Nonstacking wards, absorption, and shield-break events | `shields.ts` |
| Actual healing, overheal rejection, and healing events | `healing.ts` |
| Bounded typed combat-event queue | `events.ts` |
| Talent behavior modules by branch and active-handler registry | `talent-effects/` |
| XP drops, attraction, collection, and overflow merging | `pickups.ts` |
| XP thresholds, queued levels, offers, and validated choices | `progression.ts` |
| Deriving current run stats from selected upgrade ranks | `stats.ts` |
| Feedback events and their lifetimes | `effects.ts` |
| Distances, bounds, and swept collision geometry | `geometry.ts` |
| Run-owned seeded randomness | `random.ts` |
| Shared nearest-foe queries for talent effects | `targeting.ts` |
| Rendering-frame to fixed-tick scheduling | `clock.ts` |

`run.ts` coordinates the systems in a deliberate order: advance time/cooldowns,
expire feedback, tick periodic damage and reactions, move the player, spawn enemies,
update snares and enemy movement, attack, resolve bolts,
resolve projectile effects, cleave, strike with companions, and resolve their
effects. Collect XP, then apply contact damage and its reactions if no level reward
paused the run. This keeps killed enemies from damaging the player and gives a
level reward priority over contact. Systems mutate their own parts of the explicit
`Run` state; there is no hidden singleton state. Rendering
and input import only the state types and shared tuning they need. Keep new rules
in focused systems. Offer randomness has a separate run-owned seed stream, so
drawing upgrade cards does not consume enemy-spawn randomness. Projectile upgrades
are captured when a bolt is fired; existing shots retain their original properties.

Talent definitions live in `src/content/talents.ts`, with current numerical tuning
in `talent-tuning.ts`. Availability flags must match working implementations;
changing a preview flag alone does not implement a talent. Branch handlers live in
`src/game/talent-effects/`; shared wound/critical/Poison modifiers and Frost
consumption run before hit events.
Frost consumption snapshots a separate event, allowing both talents to react even
when the victim dies. Projectile effects resolve before melee so same-tick Frost
can be consumed. Shield-break events only come from enemy damage absorption.
Simple original Warrior/Mage/Rogue/Hunter icon paths live in `src/content/talent-icons.ts`.
Hit events snapshot critical state, active DoTs, and pre-hit slowing so lethal hits
and consuming Frost cannot erase later synergies. Handler order follows the catalog,
not allocation order. Periodic effects keep their tick clocks when refreshed and
are capped at one per kind. Shared DoT state already supports curses for task 7;
no Warlock preview has been enabled by adding that infrastructure alone.
The editor and graph renderer are separate UI modules. Feedback drawing is isolated
in `src/rendering/feedback.ts`; companion/snare/status artwork is in `hunter-effects.ts`.

Combat effects use FIFO events with source/school information, a six-generation
depth limit, 256-event queue/tick limits, and handler-ancestry suppression. Limits
apply to secondary triggers; primary damage and death drops are applied directly.
`run.effects.dropped` and `suppressed` provide diagnostics for debugging chains.
The queue stores data only, so run state stays cloneable and contains no callbacks.

Simulation/progression stays separate from rendering and input. The background
is cached, screen-density buffers are capped, and enemy/projectile/pickup/effect
counts are bounded. These are basic safeguards; full-run optimization remains a
later milestone. All current assets are original SVG or programmatic Canvas artwork;
fonts are local system fonts. All dependencies are development tools and use
open-source licenses. There are no runtime package dependencies.

Modularity and inexpensive, readable art are standing requirements. Gameplay
systems should have focused, testable modules and clear ownership; content and
tuning should be easy to find and change. New art may use simple Canvas shapes,
SVG/vectors, or monochrome/limited-palette pixels, whichever is easiest to produce.
Readable existing art can stay. See [AGENTS.md](AGENTS.md) for development guidance.
