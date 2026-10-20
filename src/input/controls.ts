import type { Point } from '../game/run';

const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

/** Keyboard and captured pointer input, with no dependency on simulation state. */
export function createControls(canvas: HTMLCanvasElement, stick: HTMLElement, enabled: () => boolean) {
  const keys = new Set<string>();
  const events = new AbortController();
  const options = { signal: events.signal };
  let pointerId: number | null = null;
  let origin = { x: 0, y: 0 };
  let direction: Point = { x: 0, y: 0 };

  const releasePointer = () => {
    const id = pointerId;
    pointerId = null;
    direction = { x: 0, y: 0 };
    stick.hidden = true;
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  };
  const clear = () => { keys.clear(); releasePointer(); };

  window.addEventListener('keydown', (event) => {
    if (!enabled() || document.activeElement !== canvas || !MOVEMENT_KEYS.has(event.code)) return;
    event.preventDefault();
    // A key held across pause/focus loss must be released before it can move again.
    if (event.repeat && !keys.has(event.code)) return;
    keys.add(event.code);
  }, options);
  window.addEventListener('keyup', (event) => { keys.delete(event.code); }, options);
  window.addEventListener('blur', clear, options);
  canvas.addEventListener('blur', clear, options);

  canvas.addEventListener('pointerdown', (event) => {
    if (!enabled() || pointerId !== null || event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    pointerId = event.pointerId;
    origin = { x: event.clientX, y: event.clientY };
    const bounds = canvas.getBoundingClientRect();
    stick.style.left = `${event.clientX - bounds.left}px`;
    stick.style.top = `${event.clientY - bounds.top}px`;
    stick.style.setProperty('--stick-x', '0px');
    stick.style.setProperty('--stick-y', '0px');
    stick.hidden = false;
    canvas.setPointerCapture(event.pointerId);
  }, options);
  canvas.addEventListener('pointermove', (event) => {
    if (pointerId !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    const length = Math.hypot(dx, dy);
    const scale = Math.max(42, length);
    direction = length < 4 ? { x: 0, y: 0 } : { x: dx / scale, y: dy / scale };
    stick.style.setProperty('--stick-x', `${direction.x * 30}px`);
    stick.style.setProperty('--stick-y', `${direction.y * 30}px`);
  }, options);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    canvas.addEventListener(name, (event) => { if (pointerId === event.pointerId) releasePointer(); }, options);
  }

  return {
    read(): Point {
      if (!enabled()) return { x: 0, y: 0 };
      if (pointerId !== null) return direction;
      return {
        x: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
        y: Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')),
      };
    },
    clear,
    destroy() { clear(); events.abort(); },
  };
}
