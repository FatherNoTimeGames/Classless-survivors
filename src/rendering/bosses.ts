import type { BossShape } from '../game/campaign-state';
import type { Run } from '../game/state';
import { drawAfflictions } from './afflictions';

function shapePath(context: CanvasRenderingContext2D, shape: BossShape): void {
  context.beginPath();
  if (shape.kind === 'cone') {
    context.moveTo(shape.origin.x, shape.origin.y);
    context.arc(shape.origin.x, shape.origin.y, shape.radius, shape.angle - shape.halfAngle, shape.angle + shape.halfAngle);
    context.closePath();
  } else if (shape.kind === 'line') {
    const angle = Math.atan2(shape.to.y - shape.from.y, shape.to.x - shape.from.x);
    const dx = -Math.sin(angle) * shape.width, dy = Math.cos(angle) * shape.width;
    context.moveTo(shape.from.x + dx, shape.from.y + dy); context.lineTo(shape.to.x + dx, shape.to.y + dy);
    context.lineTo(shape.to.x - dx, shape.to.y - dy); context.lineTo(shape.from.x - dx, shape.from.y - dy); context.closePath();
  } else if (shape.kind === 'volley') {
    for (const angle of shape.angles) {
      context.moveTo(shape.origin.x, shape.origin.y);
      context.lineTo(shape.origin.x + Math.cos(angle) * 220, shape.origin.y + Math.sin(angle) * 220);
    }
  } else {
    context.arc(shape.origin.x, shape.origin.y, shape.kind === 'circle' ? shape.radius : shape.outer, 0, Math.PI * 2);
    if (shape.kind === 'ring') {
      context.moveTo(shape.origin.x + shape.inner, shape.origin.y);
      context.arc(shape.origin.x, shape.origin.y, shape.inner, 0, Math.PI * 2, true);
    }
  }
}
export function drawBossDangers(context: CanvasRenderingContext2D, run: Run): void {
  context.save();
  for (const danger of run.campaign.dangers) {
    const active = danger.phase === 'active';
    context.strokeStyle = active ? '#ffb488' : '#f0c986';
    context.lineWidth = active ? 3 : 2; context.setLineDash(active ? [] : [5, 4]);
    shapePath(context, danger.shape);
    context.fillStyle = active ? '#db795533' : '#e0a54b18';
    if (danger.shape.kind !== 'volley') context.fill('evenodd');
    context.stroke();
    if (danger.shape.kind === 'circle' || danger.shape.kind === 'ring') {
      const { x, y } = danger.shape.origin;
      context.setLineDash([]); context.beginPath();
      if (danger.shape.kind === 'circle') { context.moveTo(x - 5, y - 5); context.lineTo(x + 5, y + 5); context.moveTo(x + 5, y - 5); context.lineTo(x - 5, y + 5); }
      else { context.moveTo(x - 4, y); context.lineTo(x, y + 4); context.lineTo(x + 7, y - 5); }
      context.stroke();
    }
  }
  context.restore();
}
/** Larger silhouettes: shield/sword, veiled wings, and three-pronged crown. */
export function drawBosses(context: CanvasRenderingContext2D, run: Run): void {
  for (const boss of run.enemies) {
    if (!boss.boss || boss.health <= 0) continue;
    context.save(); context.translate(Math.round(boss.x), Math.round(boss.y));
    if (boss.grace > 0) {
      context.strokeStyle = '#f0c986'; context.lineWidth = 2;
      context.beginPath(); context.arc(0, 0, 20 + boss.grace * 10, 0, Math.PI * 2); context.stroke(); context.globalAlpha = 0.6;
    }
    context.fillStyle = '#081313'; context.fillRect(-19, 11, 38, 6);
    if (boss.boss === 'knight') {
      context.fillStyle = '#b0b7be'; context.fillRect(-12, -13, 24, 28); context.fillRect(-8, -23, 16, 14);
      context.fillStyle = '#3e465a'; context.fillRect(-6, -19, 12, 4); context.fillRect(-18, -5, 12, 20);
      context.fillStyle = '#d2bd8b'; context.fillRect(17, -23, 4, 33); context.fillRect(12, 4, 14, 3);
    } else if (boss.boss === 'matron') {
      context.fillStyle = '#ab82b2'; context.beginPath(); context.moveTo(0, -26); context.lineTo(26, 14); context.lineTo(0, 5); context.lineTo(-26, 14); context.closePath(); context.fill();
      context.fillStyle = '#4d3a65'; context.fillRect(-8, -14, 16, 31);
      context.fillStyle = '#d2bd8b'; context.fillRect(-4, -12, 8, 3); context.fillRect(-16, -22, 32, 3);
    } else {
      context.fillStyle = '#be8a68'; context.fillRect(-12, -14, 24, 29); context.fillRect(-18, -4, 36, 8);
      context.fillStyle = '#302e43'; context.fillRect(-8, -12, 16, 12);
      context.fillStyle = '#eed18a'; context.beginPath(); context.moveTo(-13, -16); context.lineTo(-16, -30); context.lineTo(-5, -23); context.lineTo(0, -34);
      context.lineTo(5, -23); context.lineTo(16, -30); context.lineTo(13, -16); context.closePath(); context.fill();
      context.fillStyle = '#eb9a94'; context.fillRect(-5, -7, 10, 2);
    }
    if (boss.frost > 0 || boss.stun > 0 || boss.controlGuard > 0) {
      context.strokeStyle = boss.stun > 0 ? '#fff3b5' : boss.frost > 0 ? '#a5dce8' : '#b8a282';
      context.lineWidth = 1.5; context.setLineDash(boss.controlGuard > 0 ? [3, 3] : []);
      context.strokeRect(-20, -28, 40, 48);
    }
    context.restore(); drawAfflictions(context, boss);
  }
}
