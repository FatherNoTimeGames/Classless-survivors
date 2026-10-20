import type { Run } from '../game/state';

export function drawCompanions(context: CanvasRenderingContext2D, run: Run, reducedMotion = false): void {
  for (const companion of run.companions) {
    const x = Math.round(companion.x), y = Math.round(companion.y);
    if (companion.bonusDamage > 0) {
      context.strokeStyle = '#e3c583';
      context.lineWidth = 1;
      context.beginPath(); context.arc(x, y, 12, 0, Math.PI * 2); context.stroke();
    }
    if (companion.kind === 'imp') {
      context.fillStyle = '#ca8d9a';
      context.fillRect(x - 5, y - 7, 10, 14);
      context.beginPath();
      context.moveTo(x - 5, y - 4); context.lineTo(x - 8, y - 12); context.lineTo(x - 1, y - 6);
      context.moveTo(x + 5, y - 4); context.lineTo(x + 8, y - 12); context.lineTo(x + 1, y - 6);
      context.fill();
      context.fillStyle = '#ffe4a1';
      context.fillRect(x - 3, y - 3, 2, 2); context.fillRect(x + 1, y - 3, 2, 2);
      continue;
    }
    const wing = reducedMotion ? -4 : Math.sin(run.elapsed * 14) > 0 ? -7 : -2;
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
