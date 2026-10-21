import { CAMPAIGN } from '../content/bosses';
import type { BossDanger, BossFight, BossShape } from './campaign-state';
import type { Enemy, Point, Run } from './state';
import { clamp } from './geometry';

/** Lock all geometry when the warning starts. Attacks never track a dodging player. */
export function prepareBossPattern(run: Run, boss: Enemy, fight: BossFight): number {
  const origin = { x: boss.x, y: boss.y }, aim = { x: run.player.x, y: run.player.y };
  const angle = Math.atan2(aim.y - origin.y, aim.x - origin.x);
  const pattern = fight.pattern++;
  const warn = (shape: BossShape, warning: number, activeFor: number, damage: number) => {
    if (run.campaign.dangers.length >= CAMPAIGN.maxDangers) return;
    const danger: BossDanger = { id: run.nextId++, ownerId: boss.id, shape, phase: 'warning', remaining: warning, activeFor, damage };
    run.campaign.dangers.push(danger);
  };
  let warning = 1.2;
  if (fight.id === 'knight') {
    if (pattern % 2 === 0) warn({ kind: 'cone', origin, angle, radius: 90, halfAngle: Math.PI / 3 }, warning, 0.2, 18);
    else warn({ kind: 'line', from: origin, to: { x: origin.x + Math.cos(angle) * 180, y: origin.y + Math.sin(angle) * 180 }, width: 14 }, warning, 0.2, 20);
  } else if (fight.id === 'matron') {
    if (pattern % 2 === 0) warn({ kind: 'volley', origin, angles: [-0.6, -0.3, 0, 0.3, 0.6].map((offset) => angle + offset), speed: 95 }, warning, 0, 12);
    else warn({ kind: 'ring', origin: aim, inner: 28, outer: 64 }, warning, 0.25, 18);
  } else {
    warning = 1.3;
    if (pattern % 3 === 0) {
      warn({ kind: 'line', from: { x: 0, y: aim.y }, to: { x: run.world.width, y: aim.y }, width: 12 }, warning, 0.25, 20);
      warn({ kind: 'line', from: { x: aim.x, y: 0 }, to: { x: aim.x, y: run.world.height }, width: 12 }, warning, 0.25, 20);
    } else if (pattern % 3 === 1) {
      // Fixed offsets remain separated even when the player hugs a corner.
      const center: Point = { x: clamp(aim.x, 100, run.world.width - 100), y: clamp(aim.y, 100, run.world.height - 100) };
      for (const offset of [-66, 0, 66]) warn({ kind: 'circle', origin: { x: center.x + offset, y: center.y }, radius: 24 }, warning, 2, 12);
    } else warn({ kind: 'volley', origin, angles: Array.from({ length: 8 }, (_, i) => angle + i * Math.PI / 4), speed: 90 }, warning, 0, 12);
  }
  return warning;
}
