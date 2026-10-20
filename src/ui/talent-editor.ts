import { BRANCHES, TALENTS, talentById } from '../content/talents';
import type { BranchId, TalentId } from '../content/talents';
import { TALENT_TUNING } from '../content/talent-tuning';
import { allocateTalent, availableTalentCount, refundTalent, validateBuild } from '../game/builds';
import { element } from './dom';
import { renderTalentTree } from './talent-tree';

export function createTalentEditor(openButton: HTMLButtonElement, canEdit: () => boolean) {
  const dialog = element<HTMLDialogElement>('#talent-editor');
  const tabs = element('#branch-tabs', dialog);
  const tree = element('#talent-tree', dialog);
  const allocate = element<HTMLButtonElement>('#allocate-talent', dialog);
  const refund = element<HTMLButtonElement>('#refund-talent', dialog);
  const reset = element<HTMLButtonElement>('#respec-talents', dialog);
  const message = element('#talent-message', dialog);
  const events = new AbortController();
  let build: TalentId[] = [];
  let branch: BranchId = 'warrior';
  let inspected: TalentId = 'reprisal';

  function inspect(id: TalentId, reveal = false): void {
    inspected = id;
    const talent = talentById(id)!;
    const selected = build.includes(id);
    const validation = allocateTalent(build, id).validation;
    element('#talent-name', dialog).textContent = talent.name;
    element('#talent-description', dialog).textContent = talent.description;
    element('#talent-requires', dialog).textContent = talent.requires.length
      ? `Requires: ${talent.requires.map((parent) => talentById(parent)!.name).join(' + ')}` : 'No prerequisites.';
    element('#talent-synergies', dialog).textContent = `Combines with: ${talent.synergies.map((id) => BRANCHES.find((entry) => entry.id === id)!.name).join(', ')}.`;
    element('#talent-availability', dialog).textContent = selected ? 'Selected · 1 point · free refund'
      : !talent.implemented ? 'Coming soon · inspectable design, unavailable in this build'
        : validation.valid ? 'Available · costs 1 point' : validation.errors.join(' ');
    allocate.disabled = selected || !validation.valid;
    refund.disabled = !selected;
    if (reveal && window.matchMedia('(max-width: 650px)').matches) {
      element('.talent-inspector', dialog).scrollIntoView({ block: 'nearest' });
    }
  }

  function render(): void {
    const spent = validateBuild(build).pointsSpent;
    element('#talent-points', dialog).textContent = `${spent} / ${TALENT_TUNING.points} points allocated · ${TALENT_TUNING.points - spent} available`;
    element('#talent-catalog-status', dialog).textContent = `${availableTalentCount} / ${TALENTS.length} talents playable.${availableTalentCount === TALENTS.length ? ' All branches are ready to mix.' : ' Coming-soon nodes can be inspected but cannot be allocated.'}`;
    openButton.textContent = `Talents (${spent}/${TALENT_TUNING.points})`;
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('button')) {
      const id = button.dataset.branch!;
      const definition = BRANCHES.find((entry) => entry.id === id)!;
      const count = build.filter((talent) => talentById(talent)!.branch === id).length;
      button.textContent = `${definition.symbol} ${definition.name} ${count}`;
      button.setAttribute('aria-selected', String(id === branch));
      button.tabIndex = id === branch ? 0 : -1;
    }
    const definition = BRANCHES.find((entry) => entry.id === branch)!;
    element('#talent-branch-title', dialog).textContent = `${definition.name} — ${definition.theme}`;
    tree.setAttribute('aria-labelledby', `branch-${branch}`);
    reset.disabled = build.length === 0;
    renderTalentTree(tree, branch, build, inspect);
    inspect(inspected);
  }

  function selectBranch(id: BranchId): void {
    branch = id;
    inspected = TALENTS.find((talent) => talent.branch === id)!.id;
    message.textContent = '';
    render();
  }

  for (const definition of BRANCHES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `branch-${definition.id}`;
    button.dataset.branch = definition.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'talent-tree');
    button.addEventListener('click', () => selectBranch(definition.id));
    button.addEventListener('keydown', (event) => {
      const index = BRANCHES.findIndex((entry) => entry.id === definition.id);
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % BRANCHES.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + BRANCHES.length - 1) % BRANCHES.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = BRANCHES.length - 1;
      else return;
      event.preventDefault();
      selectBranch(BRANCHES[next]!.id);
      element<HTMLButtonElement>(`#branch-${BRANCHES[next]!.id}`, dialog).focus();
    });
    tabs.append(button);
  }
  allocate.addEventListener('click', () => {
    const result = allocateTalent(build, inspected);
    if (!result.validation.valid) { message.textContent = result.validation.errors.join(' '); return; }
    build = result.build;
    message.textContent = `${talentById(inspected)!.name} allocated.`;
    render();
    refund.focus();
  }, { signal: events.signal });
  refund.addEventListener('click', () => {
    const previous = build.length;
    build = refundTalent(build, inspected);
    message.textContent = `${previous - build.length} point${previous - build.length === 1 ? '' : 's'} refunded, including any dependent talents.`;
    render();
    allocate.focus();
  }, { signal: events.signal });
  reset.addEventListener('click', () => {
    build = [];
    message.textContent = 'All talent points refunded. Respecs are free.';
    render();
    element<HTMLButtonElement>(`#talent-${inspected}`, dialog).focus();
  }, { signal: events.signal });
  element('#close-talents', dialog).addEventListener('click', () => dialog.close(), { signal: events.signal });
  openButton.addEventListener('click', () => {
    if (!canEdit()) return;
    render();
    dialog.showModal();
    element<HTMLButtonElement>(`#branch-${branch}`, dialog).focus();
  }, { signal: events.signal });
  render();
  return {
    getBuild(): TalentId[] { return [...build]; },
    destroy(): void { events.abort(); dialog.close(); tabs.replaceChildren(); tree.replaceChildren(); },
  };
}
