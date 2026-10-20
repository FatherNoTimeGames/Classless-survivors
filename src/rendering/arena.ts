import type { Run } from '../game/state';
import { drawFeedback } from './feedback';
import { drawSanctuary } from './sanctuary';
import { drawBosses, drawBossDangers } from './bosses';
import { drawEnemies } from './enemies';
import { drawEnemyWarnings, drawEnemyProjectiles } from './enemy-attacks';
import { drawCompanions } from './companions';
import { drawSnares } from './snares';
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
      drawEnemyWarnings(context, run);
      drawBossDangers(context, run);
      drawSnares(context, run);
      for (const shard of run.shards) {
        const bob = Math.round(Math.sin(run.elapsed * 4 + shard.id) * 1.5);
        block(shard.x - 3, shard.y - 3 + bob, 6, 6, '#2b6a52');
        block(shard.x - 1, shard.y - 5 + bob, 2, 9, '#74cbaa');
        block(shard.x - 2, shard.y - 2 + bob, 2, 3, '#b1e7c4');
      }

      drawEnemies(context, run);
      drawBosses(context, run);

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
        context.strokeStyle = bolt.source === 'summon' ? '#dba4dc' : bolt.pierce > 0 ? '#91cfcc' : '#c17d3b';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(bolt.x - bolt.vx * 0.035, bolt.y - bolt.vy * 0.035);
        context.lineTo(bolt.x, bolt.y);
        context.stroke();
        if (bolt.source === 'summon') {
          context.fillStyle = '#f5c7ec';
          context.beginPath();
          context.moveTo(bolt.x, bolt.y - 3); context.lineTo(bolt.x + 3, bolt.y);
          context.lineTo(bolt.x, bolt.y + 3); context.lineTo(bolt.x - 3, bolt.y);
          context.closePath(); context.fill();
        } else block(bolt.x - 2, bolt.y - 2, 4, 4, bolt.blastRadius > 0 ? '#ffb878' : '#ffe2a2');
      }
      drawEnemyProjectiles(context, run);
      drawFeedback(context, run.sparks);
    },
  };
}
