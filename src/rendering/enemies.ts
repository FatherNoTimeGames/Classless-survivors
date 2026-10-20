import type { Run } from '../game/state';
import { drawAfflictions } from './afflictions';

/** Distinct, inexpensive silhouettes. The player's unique head color is never reused. */
export function drawEnemies(context: CanvasRenderingContext2D, run: Run, reducedMotion = false): void {
  const block = (x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), width, height);
  };
  for (const enemy of run.enemies) {
    if (enemy.boss || enemy.health <= 0) continue;
    context.save();
    if (enemy.grace > 0) {
      context.strokeStyle = '#c9685770'; context.lineWidth = 1;
      context.beginPath(); context.arc(enemy.x, enemy.y, (reducedMotion ? 19 : 10 + enemy.grace * 15), 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 0.5;
    }
    const x = Math.round(enemy.x), y = Math.round(enemy.y + (reducedMotion ? 0 : Math.sin(run.elapsed * 7 + enemy.id)));
    block(x - 9, y + 5, 18, 5, '#081313');
    if (enemy.kind === 'husk') {
      block(x - 7, y - 8, 14, 15, '#34242c'); block(x - 5, y - 10, 10, 14, '#6b3b4a');
      block(x - 7, y + 2, 4, 8, '#50303e'); block(x + 3, y + 2, 4, 8, '#50303e');
      block(x - 4, y - 6, 8, 5, '#181c24'); block(x - 3, y - 4, 2, 2, '#ed9c80'); block(x + 1, y - 4, 2, 2, '#ed9c80');
    } else if (enemy.kind === 'skitter') {
      block(x - 6, y - 5, 12, 10, '#497c70'); block(x - 4, y - 7, 8, 5, '#82aa82');
      for (const side of [-1, 1]) for (const offset of [-4, 0, 4]) block(x + side * 9 - 1, y + offset, 3, 2, '#7f9e70');
      block(x - 3, y - 4, 2, 2, '#e7b699'); block(x + 1, y - 4, 2, 2, '#e7b699');
    } else if (enemy.kind === 'archer') {
      block(x - 4, y - 9, 8, 7, '#c4b7a0'); block(x - 3, y - 5, 6, 3, '#293236');
      block(x - 2, y - 2, 4, 12, '#8d8477'); block(x - 6, y, 12, 2, '#b9ad91'); block(x - 5, y + 4, 10, 2, '#b9ad91');
      context.strokeStyle = '#c79b75'; context.lineWidth = 1.5;
      context.beginPath(); context.arc(x + 8, y, 9, -Math.PI / 2, Math.PI / 2); context.closePath(); context.stroke();
    } else if (enemy.kind === 'charger') {
      block(x - 9, y - 7, 18, 15, '#86543c'); block(x - 6, y - 11, 12, 10, '#b17c50');
      block(x - 10, y - 15, 4, 8, '#d3c0a0'); block(x + 6, y - 15, 4, 8, '#d3c0a0');
      block(x - 4, y - 7, 8, 3, '#281d20'); block(x - 7, y + 6, 5, 5, '#473334'); block(x + 2, y + 6, 5, 5, '#473334');
    } else {
      context.fillStyle = '#77618f'; context.beginPath(); context.moveTo(x, y - 14); context.lineTo(x + 9, y + 9); context.lineTo(x - 9, y + 9); context.closePath(); context.fill();
      block(x - 4, y - 7, 8, 5, '#23232d'); block(x - 2, y - 5, 4, 2, '#cfb2dc');
      block(x + 10, y - 10, 2, 21, '#9a8b6e'); block(x + 8, y - 12, 6, 4, '#b79ccc');
    }
    if (enemy.elite !== 'none') {
      context.strokeStyle = '#e6c36e'; context.lineWidth = 1.5;
      context.beginPath(); context.moveTo(x - 7, y - 19); context.lineTo(x - 5, y - 14); context.lineTo(x, y - 19);
      context.lineTo(x + 5, y - 14); context.lineTo(x + 7, y - 19); context.stroke();
      if (enemy.elite === 'stout') context.strokeRect(x - 11, y - 12, 22, 24);
      else { context.beginPath(); for (const offset of [-12, 12]) { context.moveTo(x + offset, y + 6); context.lineTo(x + offset, y - 3); context.lineTo(x + offset + 3, y); } context.stroke(); }
      block(x - 11, y + 14, 22, 3, '#352c28'); block(x - 11, y + 14, Math.ceil(22 * enemy.health / enemy.maxHealth), 2, '#e6c36e');
    }
    if (enemy.frost > 0 || enemy.stun > 0) {
      context.strokeStyle = enemy.stun > 0 ? '#fff3b5' : '#a5dce8'; context.lineWidth = 1.5;
      context.strokeRect(x - 9, y - 12, 18, 23); context.beginPath();
      context.moveTo(x - 5, y - 15); context.lineTo(x + 5, y - 15);
      if (enemy.frost > 0) {
        context.moveTo(x - 3, y - 18); context.lineTo(x - 3, y - 12); context.moveTo(x + 3, y - 18); context.lineTo(x + 3, y - 12);
      }
      context.stroke();
    }
    context.globalAlpha = 1; drawAfflictions(context, enemy); context.restore();
  }
}
