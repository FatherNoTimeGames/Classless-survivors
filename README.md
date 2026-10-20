# Classless Survivors

A single-player dark fantasy survival roguelite built with TypeScript and Canvas.
Mix talents freely across six fantasy archetypes. No accounts or backend required.

**Current milestone:** all **36 talents across six freely mixed branches** are
implemented. Persistent progress unlocks capstones and a bounded talent budget.
Builds support melee/spell combos, critical effects,
Poison/curses, companions, healing offense, shields, and retaliation. Runs include
movement, automatic combat, XP, temporary upgrades, defeat, and replay. Local
saves, research, named builds, and backups now work. Enemy/boss variety, victory,
and offline installation remain upcoming.
See [the task list](DEVELOPMENT_PLAN.md) and [progress log](PROGRESS.md).

## Play this milestone

Open **Talents** before a run. You start with eight talent points, can mix any branches,
and may leave points unspent. Select a branch tab, then a node to inspect its
description, prerequisites, and suggested synergies. Hover/focus help and a
persistent detail panel support mouse, keyboard, and touch. Allocate a point,
refund individual talents, or use **Free respec** to clear the whole build.
Refunding a prerequisite also refunds dependent talents. All six complete branches
are available. Thirty talents are immediately unlocked; the six capstones need
research. Prerequisites and your earned point budget still apply.

| Playable talent | Branch | Behavior |
| --- | --- | --- |
| Iron Reprisal | Warrior | Surviving contact health loss retaliates for 12 physical damage within 44 range |
| Sweeping Blade | Warrior | Auto-aim a 120° melee cleave within 50 range: 16 physical damage every 1.1s |
| Spellsteel | Warrior | Every third non-periodic physical hit fires a 12-damage ember volley within 120 range; inherits projectile upgrades; 0.25s volley limit |
| Frostbreak | Warrior | Non-periodic physical hits, including companions and retaliation, consume Frost for 8 extra physical damage and a 0.6s stun |
| Iron Ward | Warrior | Surviving health loss grants an 8-point, 3s shield; 5s cooldown |
| Last Stand | Warrior | Enemy damage breaking a shield triggers 20 physical damage within 60 range |
| Arcane Echo | Mage | Every third non-periodic fire hit strikes another nearby enemy for 9 arcane damage; linked companions qualify |
| Rime Sigil | Mage | Non-periodic fire hits and linked companion hits refresh 2s Frost, slowing enemies by 30% |
| Chain Spark | Mage | Every third arcane hit chains 10 lightning damage to a different foe within 96 range |
| Shatterglass | Mage | Physical hits consume Frost for a 10-damage arcane explosion within 36 range |
| Mana Ward | Mage | Every third triggered spell hit grants an 8-point shield for 3s |
| Riftweaver | Mage | Triggered spell hits refund 0.15s of ember, melee, and companion cooldowns, at most once per second |
| Expose Weakness | Rogue | Non-periodic hits against wounded foes add 6 damage and refund 0.15s of automatic attack cooldowns |
| Venom Edge | Rogue | Non-periodic hits apply 3 Poison damage each second for 2s; refreshes do not delay ticks |
| Killer Instinct | Rogue | Every fourth non-periodic hit crits for 1.75× damage; all schools and companions share the cadence |
| Siphon Toxin | Rogue | Natural expiration of any DoT on a surviving foe heals 2; death is not expiration |
| Contagion | Rogue | Critical hits spread all active DoTs to the two nearest other foes within 60 range, including on lethal hits |
| Nightfall | Rogue | Critical kills cause one extra tick of all active DoTs within 60 range; no recursive critical ticks |
| Ember Communion | Priest | Every fourth kill from any source attempts 3 healing; its own healing chain cannot count itself |
| Searing Grace | Priest | Requires Communion; actual healing strikes the nearest foe within 110 range for 6 holy damage |
| Sanctuary | Priest | Picking up an XP shard attempts 1 healing, at most once per second |
| Atonement | Priest | Holy hits mark for 5s; a non-periodic physical hit consumes the mark for an 8-damage holy strike if the foe survives |
| Martyr Ward | Priest | Half of excess healing accumulates as a shield, capped at 12 points with 4s refreshes |
| Dawn Chorus | Priest | Any shield absorption attempts 2 healing and strikes the nearest foe for 8 holy damage, at most once per second |
| Soul Cinder | Warlock | Every fourth kill from any source bursts for 9 shadow damage within 36 range; its own chain cannot count itself |
| Agony | Warlock | Non-periodic hits curse for 3 shadow damage each second for 3s; refreshes do not delay ticks |
| Grim Pact | Warlock | An imp fires 9-damage embers every 1.4s before haste within 180 range; inherits projectile upgrades and critical rules |
| Detonation | Warlock | Afflicted deaths explode for remaining scheduled Poison/curse damage within 36 range, capped at 18 base damage; immediate chains cannot detonate again |
| Soul Link | Warlock | Actual healing stores 40% as bonus damage for each companion's next attack, capped at 12 per companion |
| Harvest | Warlock | DoT kills attempt 2 healing and extend one nearby DoT by 1s, capped at 4s remaining |
| Hunting Momentum | Hunter | Any kill stores one additional target for the next ember volley with enough distinct targets |
| Falcon Companion | Hunter | A falcon strikes the nearest foe within 180 range for 8 physical damage each second; shares critical rules |
| Snaring Shot | Hunter | Every fourth non-periodic hit places a 2s snare within 36 range, slowing by 35%; at most eight zones |
| Pack Link | Hunter | Companions inherit wound/DoT/status effects, physical/fire triggers, and triggered-spell effects |
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
Try **all Warlock talents + Ember Communion + Searing Grace** for curses and
healing that empower the imp. Try **all Priest talents + Iron Reprisal + Sweeping
Blade** for shield retaliation and holy marks consumed by physical attacks.
**All Priest talents + Hunting Momentum + Falcon** lets physical companion attacks
consume marks. These attacks add their holy strike only if the primary hit leaves
the foe alive, making them more useful against tougher targets.
Begin with two insight to research any two capstones. More insight and two
additional talent points are earned through finished runs, as described below.

Spellsteel counts non-periodic physical hits from melee and retaliation, plus
companions with Pack Link. Its volley skips the original victim on direct hits,
can apply Frost, feeds Arcane Echo, and inherits fork, piercing, and explosions.
A 0.25s volley limit bounds area-hit fan-out; a full charge waits for an eligible
physical hit with another target and projectile space. Frostbreak and Shatterglass
react to physical hits from any attacker, without requiring Pack Link.
Kills from any source feed Communion, Soul Cinder, and Momentum, with ancestry
guards against counting their own proc chains. Spellsteel can apply Rogue wound
bonuses, Poison, curses, and critical hits, like other non-periodic damage.
Triggered spells include nonphysical talent hits, projectile explosions, and
linked magical companion hits. Direct starting embers, physical hits, and periodic
ticks do not count for Mana Ward or Riftweaver. Shields refresh without stacking
or weakening; they absorb before health. Expiration never triggers Last Stand, and fully absorbed hits do
not trigger health-loss talents. Frost has ice prongs; stuns stop movement and
contact attacks. Cleaves use arcs, wards use an oval plus a health-line amount/timer,
and spell effects have distinct shapes. Excess healing is separate from actual
restoration: only Martyr Ward converts it, while Searing Grace and Soul Link require
restored health. Martyr Ward is the explicit capped exception to nonstacking shields.
Shield expiration cannot trigger Dawn Chorus. Fatal hits cannot resurrect the player.
Talents remain separate from randomized run upgrades.

Rogue and Hunter use open hit rules: weapons, spells, blasts, and retaliation
qualify. Periodic damage cannot crit, reapply Poison/curses, or generate hit-based snares;
periodic and companion kills still supply Momentum. Companions always share your
critical cadence and critical effects; Pack Link adds the listed noncritical
on-hit and spell-trigger effects. Fire/physical school requirements still apply.
Roots stop movement but allow contact attacks; stuns stop both. Slows use the strongest value rather than stacking. Poison can spread on
lethal hits, and Nightfall pulses those newly spread effects once. These rules
prevent recursive proc loops without limiting talents to one fantasy archetype.

Imps and falcons share ownership, targeting, cooldowns, Soul Link bonuses, and
Wild Hunt commands. Pack Link also lets either apply your on-hit Poison, curses,
Frost, snares, and roots. The imp snapshots extra targets, piercing, blast radius,
and stored damage at launch. A Soul Link bonus applies to every shot of one volley;
healing or upgrades cannot alter already-fired shots. Failed/full-budget launches
retain its stored bonus. Curse marks, holy crosses, detonation crescents, and the
horned imp silhouette distinguish the new effects with simple original shapes.

Your chosen talents are copied into the new run. Editing is available before the
first run and after defeat; paused runs cannot be respecced. **Try again** uses
your current talent allocation but resets temporary upgrades. Your allocation,
research, earned points, and saved build slots survive browser reloads and closure.
Combat runs themselves are not resumed after closing or reloading the page.

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
| Quickened Ember | Ember cooldown −0.08s; melee/companion intervals shorten by the same proportion | 4 |
| Fleetfoot | Movement speed +12 | 3 |
| Soul Gatherer | XP attraction range +18 | 3 |
| Living Ember | Maximum health +12; restore 12 health | 3 |
| Forked Ember | Ember, Spellsteel, and imp volleys attack one additional distinct nearby target | 2 |
| Soul Needle | Ember, Spellsteel, and imp shots pass through one additional enemy | 2 |
| Ashburst | Ember, Spellsteel, and imp impacts explode for half shot damage before on-hit bonuses; radius +20, without chaining | 2 |


Haste changes automatic attack intervals, not DoT timing, proc counters, or talent
cooldowns. Picking it preserves elapsed cooldown progress for every attacker;
unrelated upgrades do not reset attack timers. Projectile upgrades leave falcon
strikes and melee arcs unchanged. Ashburst retains companion ownership, so imp
explosions require Pack Link for inherited on-hit effects. Already-fired shots
retain their captured upgrades and damage. See [SYNERGY_AUDIT.md](SYNERGY_AUDIT.md)
for the talent/upgrade review, tested combinations, and intentional exclusions.

Piercing bolts have a pale trail; explosive bolts produce expanding impact rings.
Open **Run upgrades** beneath the arena to inspect your ranks and ember stats.
Enemy numbers build over time, and you lose when health reaches zero. **Try again**
starts a fresh run with level 1, your chosen talents, and no run upgrades. There is no victory
condition in this milestone; defeats award persistent progress. Full enemy variety and balancing
remain later milestones; some weapon combinations can outpace the starter enemy.

Use **Pause** or **Escape** to pause and **Resume run** or **Escape** to resume.
Leaving the browser tab/window pauses the game automatically. After an input
interruption, release and press movement keys again to resume movement.

## Permanent progress and saved builds

Every finished run, including an early defeat, earns one insight while you still
need research credits. Surviving two and four minutes adds one each. Research
costs one insight per capstone and remains unlocked through every free respec.
Once your unlocked capstones plus unspent insight cover all six, insight rewards
stop. No permanent damage, health, or speed purchases exist.

Complete two runs to earn a ninth talent point, then five total runs for the tenth
and final point. Early losses count, so progression never requires winning with
an underdeveloped build. All six branches and their non-capstone talents are
available from the start. Current runs end in defeat; the reward boundary already
accepts victory for the boss milestone.

Open **Talents → Progress, saved builds & backups** to see progression and the last
result. Choose one of three build slots, enter a name, and select **Save build**.
**Load build** replaces your current allocation with that slot's snapshot. Editing
the loaded build does not change the saved slot until you save it again. Draft
allocations and research save automatically. Editing and imports are available
between runs, never during combat or an upgrade choice.

For a portable backup, expand **Backup and restore** and choose **Export backup**.
It downloads a JSON file and puts the same text in the backup box for copying.
To restore, choose a file or paste its text, select **Review backup**, check the
progress summary, then **Replace local progress**. This deliberately replaces
progress rather than merging rewards. Invalid backups leave your current profile
intact. Older supported saves are migrated; a save from a newer game is preserved
and cannot be silently overwritten by playing this version.

Saves are local to this browser and site address. Changing device, browser,
protocol, host, or port uses separate storage. Clearing site data deletes the
local copies; keep an exported backup. A previous valid save supports automatic
recovery after damaged data. Invalid builds can be cleared independently while
keeping progression. The status in Talents reports recovery or failed saving.
If local storage is disabled or full, gameplay still works in memory; export
before leaving. Stale-tab writes are rejected when a changed save is detected;
reload that tab to use the latest profile.

A run identity is saved before combat. Its reward consumes that identity in the
same profile write. Repeated defeat handling and reloads cannot claim the reward
again. Reloading discards an unfinished run without a reward and keeps completed
progress and builds. Combat snapshots and offline installation are later work.

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
Talent tests cover all 36 functioning effects, mixed-branch synergies, valid
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
Priest/Warlock browser journeys allocate complete supported builds and observe
actual healing crosses, holy attacks, wards, imp drawing, curses, and detonations.
Unit tests cover each of the twelve branch talents, partial/excess healing,
pickup throttling, holy/physical marks, final and lethal periodic ticks, explosion
caps and nonrecursion, companion bonus snapshots, and dense mixed builds.
Shared-system tests cover arc targeting, attribution, Frost consumption on lethal hits,
shield absorption/expiration, stuns, cooldown limits, and dense deterministic hybrids.
Profile tests cover bounded rewards, early-loss progression, research, earned
larger builds, slot snapshots, duplicate rewards, reloads, migrations, malformed
saves, backup recovery, import validation, storage failures, and stale-tab writes.
Browser journeys save mixed builds, respec/load/reload them, research capstones,
download and restore backups, reject bad imports, and play a restored nine-point
build. Additional cases exercise damaged saves, newer formats, and disabled
storage. The defeat/restart journey checks persisted rewards and discards an
unfinished restarted run without duplicating rewards.
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
- `src/content/`: talent/upgrade definitions and combat/permanent-progression tuning.
- `src/profile/profile.ts`: pure permanent progression, research, builds, and run rewards.
- `src/persistence/`: validated versioned codec, injected storage/recovery, and browser adapter.
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
| Shared projectile volleys, upgrade inheritance, and attribution snapshots | `projectiles.ts` |
| Shared automatic-attack haste, timer rescaling, and refunds | `attack-timing.ts` |
| Frost/stun/root lifetimes, consumption, and status/cooldown timers | `statuses.ts` |
| Hit eligibility and companion inheritance | `hit-policy.ts` |
| Shared wound bonuses, Poison/curse application, and critical cadence | `hit-modifiers.ts` |
| Nonstacking periodic state, refreshes, and snapshots | `dot-state.ts` |
| Periodic ticks, expiration events, and extra pulses | `damage-over-time.ts` |
| Snare placement, caps, aging, and occupancy | `snares.ts` |
| Companion definitions, including attack mode and follow offsets | `../content/companions.ts` |
| Companion construction independent of damage code | `companion-state.ts` |
| Run-owned companion targeting, cooldowns, and commands | `companions.ts` |
| Consumption of holy marks before physical damage | `marks.ts` |
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

Permanent rules and tuning are separate from combat. `profile/profile.ts` uses
pure transitions over a cloneable profile. `content/legacy.ts` owns the permanent
reward/point/slot limits. The simulation receives only a validated talent snapshot
and its earned budget. It never reads browser storage. `persistence/profile-codec.ts`
reconstructs known fields, validates finite bounds/prerequisites/research, repairs
individual damaged builds, and migrates the early `{version: 1, build,
completedRuns}` format to version 2. `profile-store.ts` owns storage failures,
previous-save recovery, and stale-write checks through an injected storage port.
Only `browser-profile.ts` acquires localStorage. `ui/profile-panel.ts` coordinates
named slots, backup previews, and restoration independently of the talent graph.

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
`src/game/talent-effects/`; shared wound/critical/Poison/curse modifiers and Frost
consumption run before hit events.
Frost consumption snapshots a separate event, allowing both talents to react even
when the victim dies. Projectile effects resolve before melee so same-tick Frost
can be consumed. Shield-break events only come from enemy damage absorption.
Simple original icons for all six branches live in `src/content/talent-icons.ts`.
Hit events snapshot critical state, active DoTs, and pre-hit slowing so lethal hits
and consuming Frost cannot erase later synergies. Handler order follows the catalog,
not allocation order. Periodic effects keep their tick clocks when refreshed and
are capped at one per kind. A paid periodic tick advances its clock before taking
a death snapshot, so Detonation counts only damage that has not already happened.
Holy marks and Atonement use one handler identity to prevent the bonus strike from
reapplying itself. Actual and excess healing have separate events. Pickups emit
collection events; the Priest handler owns Sanctuary's cooldown.
The editor and graph renderer are separate UI modules. Feedback drawing is isolated
in `src/rendering/feedback.ts`; companions, snares, and afflictions each have a
focused renderer under `src/rendering/`.

Combat effects use FIFO events with source/school information, a six-generation
depth limit, 512-event queue/tick limits, and handler-ancestry suppression, retained by delayed projectiles. Limits
apply to secondary triggers; primary damage and death drops are applied directly.
`run.effects.dropped` and `suppressed` provide diagnostics for debugging chains.
The queue stores data only, so run state stays cloneable and contains no callbacks.
The finite event budget accommodates simultaneous ticks on 80 foes with both DoTs
and secondary reactions. Tests retain the depth, ancestry, and fan-out safeguards;
this is not a claim of physical Android performance.

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
