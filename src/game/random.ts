/** Advance the run-owned generator so replays stay reproducible. */
export function random(run: { randomState: number }): number {
  let value = run.randomState;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  run.randomState = value >>> 0;
  return run.randomState / 0x1_0000_0000;
}
