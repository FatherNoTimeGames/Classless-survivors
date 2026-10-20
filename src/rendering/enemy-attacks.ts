import type { Run } from '../game/state';
import { ENEMY_ATTACKS as A } from '../content/enemies';

const circle = (context: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.stroke();
};
export function drawEnemyWarnings(context: CanvasRenderingContext2D, run: Run): void {
  context.save(); context.lineWidth = 1.5;
  for (const zone of run.blights) {
    context.fillStyle = '#452d4255'; context.beginPath(); context.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#b587b4'; circle(context, zone.x, zone.y, zone.radius);
    context.beginPath();
    for (const offset of [-8, 8]) {
      context.moveTo(zone.x - 7, zone.y + offset - 5); context.lineTo(zone.x + 7, zone.y + offset + 5);
      context.moveTo(zone.x - 7, zone.y + offset + 5); context.lineTo(zone.x + 7, zone.y + offset - 5);
    }
    context.stroke();
  }
  for (const enemy of run.enemies) {
    if (enemy.health <= 0 || enemy.grace > 0 || enemy.attack.phase !== 'windup') continue;
    const aim = enemy.attack.aim;
    if (enemy.kind === 'hexer') {
      context.strokeStyle = '#d6a2cf'; context.setLineDash([3, 4]); circle(context, aim.x, aim.y, A.blightRadius);
      context.setLineDash([]); context.beginPath();
      context.moveTo(aim.x - 6, aim.y - 6); context.lineTo(aim.x + 6, aim.y + 6);
      context.moveTo(aim.x + 6, aim.y - 6); context.lineTo(aim.x - 6, aim.y + 6); context.stroke();
    } else {
      context.strokeStyle = enemy.kind === 'charger' ? '#e4a46d' : '#d58f8b';
      context.setLineDash(enemy.kind === 'charger' ? [6, 4] : [2, 5]);
      context.beginPath(); context.moveTo(enemy.x, enemy.y); context.lineTo(aim.x, aim.y); context.stroke(); context.setLineDash([]);
      const side = enemy.attack.direction;
      context.beginPath(); context.moveTo(aim.x - side.x * 8 - side.y * 5, aim.y - side.y * 8 + side.x * 5);
      context.lineTo(aim.x, aim.y); context.lineTo(aim.x - side.x * 8 + side.y * 5, aim.y - side.y * 8 - side.x * 5); context.stroke();
    }
  }
  context.restore();
}
export function drawEnemyProjectiles(context: CanvasRenderingContext2D, run: Run): void {
  context.save(); context.strokeStyle = '#f08e87'; context.lineWidth = 2;
  for (const bolt of run.enemyBolts) {
    const length = Math.hypot(bolt.vx, bolt.vy), dx = bolt.vx / length, dy = bolt.vy / length;
    context.beginPath(); context.moveTo(bolt.x - dx * 10, bolt.y - dy * 10); context.lineTo(bolt.x, bolt.y);
    context.moveTo(bolt.x - dx * 5 - dy * 3, bolt.y - dy * 5 + dx * 3); context.lineTo(bolt.x, bolt.y);
    context.lineTo(bolt.x - dx * 5 + dy * 3, bolt.y - dy * 5 - dx * 3); context.stroke();
  }
  context.restore();
}
