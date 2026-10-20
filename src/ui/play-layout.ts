/** Viewport/layout boundary. Sizes only presentation; it never reads combat state. */
export function createPlayLayout(shell: HTMLElement, panel: HTMLElement, hud: HTMLElement, toolbar: HTMLElement, callbacks: { onResize: () => void; onRotate: () => void }) {
  const events = new AbortController(), options = { signal: events.signal };
  const landscape = window.matchMedia('(orientation: landscape) and (max-height: 600px)');
  const portrait = window.matchMedia('(orientation: portrait)');
  let wasPortrait = portrait.matches;
  function refresh(): void {
    // Pinch zoom should magnify the page rather than shrink the game again.
    const viewport = window.visualViewport;
    const height = viewport && viewport.scale <= 1.01 ? viewport.height : window.innerHeight;
    const padding = getComputedStyle(shell);
    const chrome = landscape.matches ? 0 : hud.getBoundingClientRect().height + toolbar.getBoundingClientRect().height;
    const available = Math.max(160, Math.floor(height - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom) - chrome - 2));
    panel.style.setProperty('--arena-height', `${available}px`);
  }
  const resized = () => {
    refresh(); callbacks.onResize();
    // Resize and media-query events can arrive separately. Pause once per actual
    // rotation so a delayed query event cannot pause an already resumed run.
    const next = portrait.matches;
    if (next !== wasPortrait) { wasPortrait = next; callbacks.onRotate(); }
  };
  window.addEventListener('resize', resized, options);
  window.visualViewport?.addEventListener('resize', resized, options);
  portrait.addEventListener('change', resized, options);
  const observer = new ResizeObserver(refresh);
  observer.observe(hud); observer.observe(toolbar);
  refresh();
  return {
    enter(): void { refresh(); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); },
    destroy(): void { observer.disconnect(); events.abort(); },
  };
}
