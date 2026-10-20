export type MotionPreference = 'system' | 'reduced' | 'full';
export interface PresentationPreferences { version: 1; muted: boolean; volume: number; motion: MotionPreference }
export const defaultPresentation = (): PresentationPreferences => ({ version: 1, muted: false, volume: 0.3, motion: 'system' });
export const reducedMotion = (preference: MotionPreference, systemReduced: boolean) => preference === 'reduced' || (preference === 'system' && systemReduced);

/** Settings are independent of progress/build backups. Unknown newer formats are preserved. */
export function decodePresentation(raw: string | null): { value: PresentationPreferences; writable: boolean; notice: string } {
  if (raw === null) return { value: defaultPresentation(), writable: true, notice: '' };
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data === 'object' && data !== null && 'version' in data && typeof data.version === 'number' && data.version > 1) {
      return { value: defaultPresentation(), writable: false, notice: 'Newer sound/display settings preserved. Changes apply to this tab.' };
    }
    if (typeof data === 'object' && data !== null && 'version' in data && data.version === 1
      && 'muted' in data && typeof data.muted === 'boolean' && 'volume' in data && typeof data.volume === 'number'
      && Number.isFinite(data.volume) && data.volume >= 0 && data.volume <= 1
      && 'motion' in data && typeof data.motion === 'string' && ['system', 'reduced', 'full'].includes(data.motion)) {
      return { value: { version: 1, muted: data.muted, volume: data.volume, motion: data.motion as MotionPreference }, writable: true, notice: '' };
    }
  } catch { /* Damaged settings can be replaced on an explicit settings change. */ }
  return { value: defaultPresentation(), writable: true, notice: 'Sound/display settings reset to defaults.' };
}
