import { decodeProfile, encodeProfile } from './profile-codec';
import { newProfile } from '../profile/profile';
import type { Profile } from '../profile/profile';
import { LEGACY } from '../content/legacy';

export const SAVE_KEY = 'classless-survivors.save';
export const BACKUP_KEY = `${SAVE_KEY}.backup`;
export const RECOVERY_KEY = `${SAVE_KEY}.recovery`;
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type ProfileStore = ReturnType<typeof createProfileStore>;

/** Inject storage for tests; this module imports no DOM or browser APIs. */
export function createProfileStore(storage: StoragePort | null) {
  let profile = newProfile();
  let knownRaw: string | null = null;
  let notice = '';
  let blocked = false;
  let durable = false;
  try {
    knownRaw = storage?.getItem(SAVE_KEY) ?? null;
    if (!storage) notice = 'Local saving is unavailable. Progress lasts for this page session; export a backup before leaving.';
    if (knownRaw !== null) {
      const decoded = decodeProfile(knownRaw);
      if (decoded.ok) { profile = decoded.profile; notice = decoded.notices.join(' '); durable = true; }
      else if (decoded.future) { notice = decoded.reason + ' Playing will use a temporary profile; export to keep it.'; blocked = true; }
      else {
        const previous = storage?.getItem(BACKUP_KEY);
        const backup = previous ? decodeProfile(previous) : null;
        if (backup?.ok) { profile = backup.profile; notice = 'Recovered the previous local save after damaged data was found. Some recent changes may be missing.'; }
        else notice = 'Damaged save data was found. A fresh profile is available; import a backup to restore progress.';
        try { storage?.setItem(RECOVERY_KEY, knownRaw); } catch { /* Keep original primary until a real write succeeds. */ }
      }
    }
  } catch { storage = null; notice = 'Local saving is unavailable. Progress lasts for this page session; export a backup before leaving.'; }
  // Combat is intentionally not restored. Never infer a reward from an unfinished run.
  if (profile.activeRun !== null) { profile = { ...profile, activeRun: null }; notice += ' An unfinished run was discarded; completed progress and builds were retained.'; durable = false; }

  function commit(next: Profile, importing = false): boolean {
    if (storage && (!blocked || importing)) {
      try {
        if (storage.getItem(SAVE_KEY) !== knownRaw) { notice = 'Progress changed in another tab. Reload this page before making more changes.'; return false; }
      } catch {
        // An unchecked write could replace newer progress. Continue in memory instead.
        storage = null;
        notice = 'Local saving is unavailable. Changes are in memory; export a backup before leaving.';
      }
    }
    const validated = decodeProfile(encodeProfile(next));
    if (!validated.ok || validated.notices.length) return false;
    // The raw saved payload guards stale writes; revision can safely saturate.
    const updated = { ...validated.profile, revision: Math.min(LEGACY.maxRevision, profile.revision + 1) };
    if (storage && (!blocked || importing)) {
      try {
        // Preserve the previous valid primary; a bad/future payload is never a fallback.
        if (knownRaw && decodeProfile(knownRaw).ok) {
          try { storage.setItem(BACKUP_KEY, knownRaw); } catch { /* Primary can still succeed with limited quota. */ }
        }
        if (importing && knownRaw && !decodeProfile(knownRaw).ok) {
          try { storage.setItem(RECOVERY_KEY, knownRaw); } catch { /* Explicit import can proceed without a recovery copy. */ }
        }
        const encoded = encodeProfile(updated);
        storage.setItem(SAVE_KEY, encoded);
        knownRaw = encoded; durable = true; blocked = false;
        notice = 'Progress saved on this device.';
      } catch {
        if (importing) { notice = 'Could not save the imported backup. Your current profile was kept.'; return false; }
        durable = false;
        notice = 'Could not save locally. Changes are in memory; export a backup before leaving.';
      }
    } else durable = false;
    profile = updated;
    return true;
  }
  return {
    get: () => structuredClone(profile),
    status: () => ({ notice, durable, blocked }),
    change(action: (current: Profile) => Profile | null): boolean {
      const next = action(structuredClone(profile));
      return next !== null && commit(next);
    },
    export: () => encodeProfile({ ...profile, activeRun: null }),
    import(text: string): { ok: boolean; message: string } {
      const decoded = decodeProfile(text);
      if (!decoded.ok) return { ok: false, message: decoded.reason };
      if (decoded.repaired) return { ok: false, message: `Backup needs repairs: ${decoded.notices.join(' ')}` };
      const next = { ...decoded.profile, activeRun: null };
      const ok = commit(next, true);
      return { ok, message: ok ? durable ? 'Backup restored. Its progress and builds replace this device’s profile.' : 'Backup loaded for this page session. Saving is unavailable; keep your exported backup.' : notice };
    },
  };
}
