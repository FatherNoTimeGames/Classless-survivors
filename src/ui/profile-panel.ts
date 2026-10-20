import type { ProfileStore } from '../persistence/profile-store';
import { decodeProfile } from '../persistence/profile-codec';
import { LEGACY } from '../content/legacy';
import { MAX_POINTS, RESEARCH_TALENTS, talentBudget, saveSlot, loadSlot } from '../profile/profile';
import { element, formatTime } from './dom';

/** Saved-build and backup controls are independent of the talent graph/editor. */
export function createProfilePanel(store: ProfileStore, changed: () => void) {
  const root = element('#profile-panel');
  const events = new AbortController();
  const select = element<HTMLSelectElement>('#build-slot', root);
  const name = element<HTMLInputElement>('#build-name', root);
  const text = element<HTMLTextAreaElement>('#backup-text', root);
  const confirm = element<HTMLButtonElement>('#confirm-import', root);
  const preview = element('#import-preview', root);
  const message = element('#profile-message', root);
  let reviewed: string | null = null;
  function render(): void {
    const profile = store.get();
    element('#profile-summary', root).textContent = `${profile.completedRuns} runs completed · ${talentBudget(profile)} talent points · ${profile.insight} insight · ${profile.unlocked.length}/${RESEARCH_TALENTS.length} capstones researched`;
    const milestone = LEGACY.pointMilestones.find((count) => profile.completedRuns < count);
    element('#profile-next', root).textContent = milestone ? `Next talent point after ${milestone} completed runs (${milestone - profile.completedRuns} remaining). Maximum: ${MAX_POINTS} points.` : `All ${MAX_POINTS} talent points earned. Respec and experiment freely.`;
    const last = profile.lastResult;
    element('#profile-last-run', root).textContent = last ? `Last run: ${last.outcome} · ${formatTime(last.seconds)} · ${last.kills} slain · ${last.insight} insight earned. Best survival: ${formatTime(profile.bestSeconds)}.` : 'No completed runs yet. Even an early defeat earns progress.';
    element('#save-status').textContent = store.status().notice || 'Progress and builds save automatically on this device.';
    const index = Number(select.value) || 0;
    select.replaceChildren(...profile.slots.map((slot, i) => {
      const option = document.createElement('option'); option.value = String(i); option.textContent = `${i + 1}. ${slot.name} (${slot.talents.length} talents)`; return option;
    }));
    select.value = String(index);
    if (!name.value) name.value = profile.slots[index]!.name;
  }
  select.addEventListener('change', () => { name.value = store.get().slots[Number(select.value)]!.name; }, { signal: events.signal });
  element('#save-build', root).addEventListener('click', () => {
    if (!name.value.trim() || name.value.trim().length > 32) { message.textContent = 'Use a name between 1 and 32 characters.'; return; }
    const ok = store.change((profile) => saveSlot(profile, Number(select.value), name.value));
    message.textContent = ok ? 'Build saved in this slot.' : store.status().notice || 'Use a name between 1 and 32 characters.';
    changed();
  }, { signal: events.signal });
  element('#load-build', root).addEventListener('click', () => {
    const ok = store.change((profile) => loadSlot(profile, Number(select.value)));
    message.textContent = ok ? 'Saved build loaded. You can respec freely.' : store.status().notice || 'This build could not be loaded.';
    changed();
  }, { signal: events.signal });
  element('#export-backup', root).addEventListener('click', () => {
    text.value = store.export(); reviewed = null; confirm.hidden = true; preview.textContent = '';
    const url = URL.createObjectURL(new Blob([text.value], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'classless-survivors-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message.textContent = 'Backup downloaded and shown below for copying. Keep it somewhere safe.';
  }, { signal: events.signal });
  function invalidate(): void { reviewed = null; confirm.hidden = true; preview.textContent = ''; }
  text.addEventListener('input', invalidate, { signal: events.signal });
  element<HTMLInputElement>('#backup-file', root).addEventListener('change', async (event) => {
    invalidate();
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > LEGACY.maxBackupLength) { message.textContent = 'Backup is too large.'; return; }
    try { text.value = await file.text(); message.textContent = 'File loaded. Review the backup before restoring.'; }
    catch { message.textContent = 'The file could not be read.'; }
  }, { signal: events.signal });
  element('#review-backup', root).addEventListener('click', () => {
    const decoded = decodeProfile(text.value);
    invalidate();
    if (!decoded.ok) { message.textContent = decoded.reason; return; }
    if (decoded.repaired) { message.textContent = `Backup needs repairs: ${decoded.notices.join(' ')}`; return; }
    reviewed = text.value;
    preview.textContent = `Replace this device’s progress with ${decoded.profile.completedRuns} completed runs, ${talentBudget(decoded.profile)} points, ${decoded.profile.unlocked.length} researched capstones, and ${decoded.profile.slots.length} build slots? A previous-save recovery copy is kept when storage space permits. An unfinished run will not be restored.`;
    confirm.hidden = false; message.textContent = 'Backup is valid. Review the replacement above.';
  }, { signal: events.signal });
  confirm.addEventListener('click', () => {
    if (reviewed === null || text.value !== reviewed) return invalidate();
    const result = store.import(reviewed);
    message.textContent = result.message;
    if (result.ok) { invalidate(); name.value = ''; changed(); }
    render();
  }, { signal: events.signal });
  return { render, destroy: () => events.abort() };
}
