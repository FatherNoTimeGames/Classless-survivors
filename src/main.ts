import './styles.css';
import { drawSanctuary } from './rendering/sanctuary';
import { fitViewport } from './rendering/viewport';

const canvas = document.querySelector<HTMLCanvasElement>('#arena');
const error = document.querySelector<HTMLElement>('#canvas-error');
if (!canvas || !error) throw new Error('The sanctuary shell is missing.');

const context = canvas.getContext('2d');
if (!context) {
  error.hidden = false;
} else {
  const render = () => {
    const { width, height } = canvas.getBoundingClientRect();
    const viewport = fitViewport(width, height, window.devicePixelRatio);
    if (!viewport) return;
    canvas.width = viewport.bufferWidth;
    canvas.height = viewport.bufferHeight;
    context.imageSmoothingEnabled = false;
    context.setTransform(viewport.scale, 0, 0, viewport.scale, viewport.offsetX, viewport.offsetY);
    drawSanctuary(context);
  };

  const observer = new ResizeObserver(render);
  observer.observe(canvas);
  // Also refresh if screen density changes without a CSS-size change.
  window.addEventListener('resize', render);
  render();
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      observer.disconnect();
      window.removeEventListener('resize', render);
    });
  }
}
