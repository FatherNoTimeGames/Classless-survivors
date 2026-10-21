/** Viewport sizing and interruption events; no simulation or menu ownership. */
export function createPlayLayout(shell: HTMLElement, callbacks: { onResize: () => void; onRotate: () => void }) {
  const events = new AbortController(), options = { signal: events.signal };
  const portrait = window.matchMedia('(orientation: portrait)');
  let wasPortrait = portrait.matches;
  function refresh(): void {
    const viewport = window.visualViewport;
    const height = viewport && viewport.scale <= 1.01 ? viewport.height : window.innerHeight;
    shell.style.setProperty('--game-height', `${height}px`);
  }
  const resized = () => {
    refresh(); callbacks.onResize();
    const next = portrait.matches;
    if (next !== wasPortrait) { wasPortrait = next; callbacks.onRotate(); }
  };
  window.addEventListener('resize', resized, options);
  window.visualViewport?.addEventListener('resize', resized, options);
  portrait.addEventListener('change', resized, options);
  refresh();
  return { enter: refresh, destroy(): void { events.abort(); } };
}
