import { decodePresentation, defaultPresentation } from '../presentation/preferences';
import type { PresentationPreferences } from '../presentation/preferences';
export const PRESENTATION_KEY = 'classless-survivors:presentation:v1';
interface SettingsStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

export function createPresentationStore(storage: SettingsStorage | null) {
  let loaded;
  try { loaded = decodePresentation(storage?.getItem(PRESENTATION_KEY) ?? null); }
  catch { loaded = { value: defaultPresentation(), writable: true, notice: 'Settings apply to this tab; browser storage is unavailable.' }; }
  let value = loaded.value, notice = loaded.notice;
  return {
    get: (): PresentationPreferences => ({ ...value }),
    notice: () => notice,
    update(next: PresentationPreferences): void {
      const checked = decodePresentation(JSON.stringify(next));
      if (checked.notice || !checked.writable) return;
      value = checked.value;
      if (!loaded.writable) return;
      try {
        if (!storage) throw new Error('Storage unavailable');
        storage.setItem(PRESENTATION_KEY, JSON.stringify(value)); notice = '';
      } catch { notice = 'Settings apply to this tab; browser storage is unavailable.'; }
    },
  };
}
export type PresentationStore = ReturnType<typeof createPresentationStore>;
export function openPresentationStore(): PresentationStore {
  try { return createPresentationStore(window.localStorage); } catch { return createPresentationStore(null); }
}
