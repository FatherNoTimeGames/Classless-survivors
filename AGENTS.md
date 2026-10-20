# Project instructions

## Work cycles

Read PROGRESS.md and DEVELOPMENT_PLAN.md before implementation. Complete only the
next authorized task, validate it, update progress, commit, report, and wait for
the user to say **continue**. A clarification or specification update is not an
instruction to start the next milestone. Make ordinary design decisions without
asking the user.

## Modularity is a requirement

Optimize for finding bugs and changing one system safely. Use focused modules
with explicit typed inputs, outputs, and state ownership. Keep simulation and
progression independent of browser APIs so they can be tested directly.

- Input translates devices into commands; it does not apply combat rules.
- Simulation owns gameplay state. Separate movement, spawning, targeting,
  damage/effects, pickups, and progression as those systems grow. Keep run.ts as
  the tick coordinator; extend the focused modules rather than moving their rules
  back into the coordinator. See the module map in README.md.
- Rendering reads state and draws it; it does not advance gameplay or award XP.
- UI coordinates screens and player choices; gameplay calculations belong in
  simulation modules. Persistence is a separate boundary with validated data.
- Keep talent/ability/enemy/upgrade definitions and tuning easy to locate and
  separate from generic mechanics. Reuse well-defined effect handlers instead
  of duplicating logic across talents or adding unrelated branches to one function.
- Avoid circular dependencies, hidden mutable globals, and unnecessary frameworks
  or abstraction layers. Split by responsibility, not an arbitrary line count.
- Test observable system behavior and important interactions. Preserve existing
  behavior with regression checks when extracting modules.

## Art should be inexpensive to produce

The user prioritizes readability and low implementation effort over visual
detail. Choose the simplest original, programmatic art that communicates play:
Canvas shapes, SVG/vector art, or limited-palette/monochrome pixel art are all
acceptable. Pixel art is not mandatory. Reuse the existing procedural style when
that is easiest; do not redraw readable art solely to increase detail.

Make players, enemies, pickups, attacks, and hazards distinguishable by silhouette,
contrast, and restrained effects at phone sizes. Do not rely only on color.
Keep a coherent dark fantasy mood. No paid asset services or copyrighted game
assets. Presentation work should fill missing visual cues and improve readability,
not become an elaborate asset-production project.

## Validation

Use `npm test` and `npm run build` for logic/code changes. For browser behavior,
run `npm run test:browser` after building; this cloud instance uses
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. `npm run check` combines
these checks. Documentation-only changes need a diff/consistency check, not an
application test rerun. Report checks accurately, including physical-device limits.
