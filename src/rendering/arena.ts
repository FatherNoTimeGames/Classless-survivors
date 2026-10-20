import type { Run } from '../game/state';
import { drawFeedback } from './feedback';
import { drawSanctuary } from './sanctuary';
import { drawAfflictions, drawCompanions, drawSnares } from './hunter-effects';
import { ARENA_HEIGHT, ARENA_WIDTH, fitViewport } from './viewport';

export function createArenaRenderer(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const backdrop = document.createElement('canvas');
  backdrop.width = ARENA_WIDTH;
  backdrop.height = ARENA_HEIGHT;
  const backdropContext = backdrop.getContext('2d');
  if (!backdropContext) return null;
  drawSanctuary(backdropContext);

  const block = (x: number, y: number, w: number, h: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const shadow = (x: number, y: number) => block(x - 9, y + 5, 18, 5, '#081313');

  return {
    draw(run: Run | null): void {
      const bounds = canvas.getBoundingClientRect();
      const view = fitViewport(bounds.width, bounds.height, window.devicePixelRatio);
      if (!view) return;
      if (canvas.width !== view.bufferWidth) canvas.width = view.bufferWidth;
      if (canvas.height !== view.bufferHeight) canvas.height = view.bufferHeight;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
      context.imageSmoothingEnabled = false;
      context.drawImage(backdrop, 0, 0);
      if (!run) return;

      context.strokeStyle = '#67714a60';
      context.lineWidth = 1;
      context.strokeRect(8, 8, ARENA_WIDTH - 16, ARENA_HEIGHT - 16);
      drawSnares(context, run);
      for (const shard of run.shards) {
        const bob = Math.round(Math.sin(run.elapsed * 4 + shard.id) * 1.5);
        block(shard.x - 3, shard.y - 3 + bob, 6, 6, '#2b6a52');
        block(shard.x - 1, shard.y - 5 + bob, 2, 9, '#74cbaa');
        block(shard.x - 2, shard.y - 2 + bob, 2, 3, '#b1e7c4');
      }

      for (const enemy of run.enemies) {
        if (enemy.grace > 0) {
          context.strokeStyle = '#c9685770';
          context.beginPath();
          context.arc(enemy.x, enemy.y, 10 + enemy.grace * 15, 0, Math.PI * 2);
          context.stroke();
          context.globalAlpha = 0.5;
        }
        const bob = Math.round(Math.sin(run.elapsed * 7 + enemy.id));
        const { x } = enemy;
        const y = enemy.y + bob;
        shadow(x, y);
        block(x - 7, y - 8, 14, 15, '#34242c');
        block(x - 5, y - 10, 10, 14, '#6b3b4a');
        block(x - 7, y + 2, 4, 8, '#50303e');
        block(x + 3, y + 2, 4, 8, '#50303e');
        block(x - 4, y - 6, 8, 5, '#181c24');
        block(x - 3, y - 4, 2, 2, '#ed9c80');
        block(x + 1, y - 4, 2, 2, '#ed9c80');
        if (enemy.frost > 0 || enemy.stun > 0) {
          context.strokeStyle = enemy.stun > 0 ? '#fff3b5' : '#a5dce8';
          context.lineWidth = 1.5;
          context.strokeRect(x - 9, y - 12, 18, 23);
          // A cap for stun, two ice prongs for Frost: status is not color alone.
          context.beginPath();
          context.moveTo(x - 5, y - 15); context.lineTo(x + 5, y - 15);
          if (enemy.frost > 0) {
            context.moveTo(x - 3, y - 18); context.lineTo(x - 3, y - 12);
            context.moveTo(x + 3, y - 18); context.lineTo(x + 3, y - 12);
          }
          context.stroke();
        }
        context.globalAlpha = 1;
        drawAfflictions(context, enemy);
      }

      const player = run.player;
      const bob = player.moving ? Math.round(Math.sin(run.elapsed * 16)) : 0;
      const x = Math.round(player.x);
      const y = Math.round(player.y) + bob;
      shadow(x, y);
      if (player.shield.amount > 0) {
        context.strokeStyle = '#8fbddc';
        context.lineWidth = 2;
        context.beginPath();
        context.ellipse(x, y - 2, 16, 21, 0, 0, Math.PI * 2);
        context.stroke();
      }
      if (player.invulnerable > 0) {
        context.strokeStyle = '#e88c71';
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(x, y, 13, 0, Math.PI * 2);
        context.stroke();
      }
      block(x - 6, y - 5, 12, 15, '#172b37');
      block(x - 5, y - 3, 10, 11, '#497180');
      block(x - 5, y + 8, 4, 4, '#11252e');
      block(x + 1, y + 8, 4, 4, '#11252e');
      block(x - 5, y - 13, 10, 8, '#273c45');
      block(x - 3, y - 10, 6, 5, '#e8dcc0');
      block(x - 6, y - 4, 12, 3, '#bb7d4c');
      block(x + player.facing * 9, y - 8, 2, 19, '#9f8051');
      block(x + player.facing * 9 - 2, y - 11, 6, 6, '#e2ae63');

      drawCompanions(context, run);
      for (const bolt of run.bolts) {
        context.strokeStyle = bolt.pierce > 0 ? '#91cfcc' : '#c17d3b';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(bolt.x - bolt.vx * 0.035, bolt.y - bolt.vy * 0.035);
        context.lineTo(bolt.x, bolt.y);
        context.stroke();
        block(bolt.x - 2, bolt.y - 2, 4, 4, bolt.blastRadius > 0 ? '#ffb878' : '#ffe2a2');
      }
      drawFeedback(context, run.sparks);
    },
  };
}
