import type { Run } from '../game/state';

/** Player silhouette stays above friendly effects and ground warnings. No camera shake or flashing. */
export function drawPlayer(context: CanvasRenderingContext2D, run: Run, reducedMotion: boolean): void {
  const block = (x: number, y: number, w: number, h: number, color: string) => {
    context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const shadow = (x: number, y: number) => block(x - 9, y + 5, 18, 5, '#081313');
  context.strokeStyle = '#111c22'; context.lineWidth = 3;
  context.strokeRect(Math.round(run.player.x) - 7, Math.round(run.player.y) - 14, 14, 26);
      const player = run.player;
      const bob = !reducedMotion && player.moving ? Math.round(Math.sin(run.elapsed * 16)) : 0;
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

}
