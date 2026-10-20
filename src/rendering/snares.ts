import type { Run } from '../game/state';

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

