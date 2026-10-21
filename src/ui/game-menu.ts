import { element } from './dom';

/** One native, internally scrolling menu; opening never resumes paused combat. */
export function createGameMenu(onOpen: () => void) {
  const dialog = element<HTMLDialogElement>('#game-menu');
  const button = element<HTMLButtonElement>('#open-menu');
  const events = new AbortController(), options = { signal: events.signal };
  button.addEventListener('click', () => { onOpen(); if (!dialog.open) dialog.showModal(); }, options);
  element('#close-menu').addEventListener('click', () => dialog.close(), options);
  return { destroy(): void { events.abort(); dialog.close(); } };
}
