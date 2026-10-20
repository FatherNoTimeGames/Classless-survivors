import type { Enemy, Run } from '../game/state';

export function drawSnares(context: CanvasRenderingContext2D, run: Run): void {
  context.lineWidth = 1;
  context.strokeStyle = '#93b58a';
  for (const snare of run.snares) {
    context.globalAlpha = Math.min(0.55, snare.remaining);
    context.setLineDash([5, 4]);
    context.beginPath();
    context.arc(snare.x, snare.y, snare.radius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(snare.x - 6, snare.y - 6); context.lineTo(snare.x + 6, snare.y + 6);
    context.moveTo(snare.x + 6, snare.y - 6); context.lineTo(snare.x - 6, snare.y + 6);
    context.stroke();
  }
  context.globalAlpha = 1;
}

export function drawAfflictions(context: CanvasRenderingContext2D, enemy: Enemy): void {
  if (enemy.dots.length) {
    context.fillStyle = '#a8c978';
    context.fillRect(enemy.x - 8, enemy.y - 16, 3, 3);
    context.fillRect(enemy.x - 3, enemy.y - 19, 3, 3);
    context.fillRect(enemy.x + 2, enemy.y - 16, 3, 3);
  }
  if (enemy.root > 0) {
    context.strokeStyle = '#a5dce8';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(enemy.x - 11, enemy.y + 11); context.lineTo(enemy.x + 11, enemy.y + 11);
    for (const x of [-8, 0, 8]) {
      context.moveTo(enemy.x + x, enemy.y + 14); context.lineTo(enemy.x + x, enemy.y + 5);
    }
    context.stroke();
  }
}

export function drawCompanions(context: CanvasRenderingContext2D, run: Run): void {
  for (const companion of run.companions) {
    const x = Math.round(companion.x), y = Math.round(companion.y);
    const wing = Math.sin(run.elapsed * 14) > 0 ? -7 : -2;
    context.fillStyle = '#c5d6bd';
    context.beginPath();
    context.moveTo(x - 12, y + wing); context.lineTo(x - 2, y + 1);
    context.lineTo(x, y - 3); context.lineTo(x + 2, y + 1);
    context.lineTo(x + 12, y + wing); context.lineTo(x + 5, y + 5);
    context.lineTo(x, y + 3); context.lineTo(x - 5, y + 5);
    context.closePath(); context.fill();
    context.fillStyle = '#d7a85c';
    context.fillRect(x + 1, y - 2, 4, 2);
  }
}
