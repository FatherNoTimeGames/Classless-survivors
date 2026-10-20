import type { Enemy } from '../game/state';

export function drawAfflictions(context: CanvasRenderingContext2D, enemy: Enemy): void {
  if (enemy.dots.some((dot) => dot.kind === 'poison')) {
    context.fillStyle = '#a8c978';
    context.fillRect(enemy.x - 8, enemy.y - 16, 3, 3);
    context.fillRect(enemy.x - 3, enemy.y - 19, 3, 3);
    context.fillRect(enemy.x + 2, enemy.y - 16, 3, 3);
  }
  if (enemy.dots.some((dot) => dot.kind === 'curse')) {
    context.strokeStyle = '#bd9be8';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(enemy.x + 7, enemy.y - 16, 4, Math.PI / 2, Math.PI * 1.5);
    context.stroke();
  }
  if (enemy.holyMark > 0) {
    context.strokeStyle = '#e3c583';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(enemy.x - 12, enemy.y - 16); context.lineTo(enemy.x - 4, enemy.y - 16);
    context.moveTo(enemy.x - 8, enemy.y - 20); context.lineTo(enemy.x - 8, enemy.y - 12);
    context.stroke();
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

