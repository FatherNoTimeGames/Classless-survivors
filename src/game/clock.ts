import { STEP } from './rules';

/** Bounded catch-up keeps low frame rates fair without simulating tab absences. */
export class FixedClock {
  private accumulator = 0;

  advance(seconds: number, tick: () => void): void {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    this.accumulator += Math.min(seconds, 0.25);
    while (this.accumulator + 1e-10 >= STEP) {
      tick();
      this.accumulator = Math.max(0, this.accumulator - STEP);
    }
  }

  reset(): void { this.accumulator = 0; }
}
