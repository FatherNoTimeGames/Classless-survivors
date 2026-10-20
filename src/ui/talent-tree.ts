import { TALENTS, talentById } from '../content/talents';
import type { BranchId, TalentDefinition, TalentId } from '../content/talents';

const centerX = (talent: TalentDefinition) => talent.tier === 0 || talent.tier === 3 ? 100 : 50 + talent.slot * 100;

export function renderTalentTree(root: HTMLElement, branch: BranchId, build: readonly TalentId[], inspect: (id: TalentId, reveal?: boolean) => void): void {
  root.replaceChildren();
  const nodes = TALENTS.filter((talent) => talent.branch === branch);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 400');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('talent-links');
  for (const talent of nodes) {
    for (const parentId of talent.requires) {
      const parent = talentById(parentId)!;
      const line = document.createElementNS(svg.namespaceURI, 'path');
      const startY = parent.tier * 100 + 82;
      const endY = talent.tier * 100 + 18;
      line.setAttribute('d', `M${centerX(parent)} ${startY} V${(startY + endY) / 2} H${centerX(talent)} V${endY}`);
      line.setAttribute('class', build.includes(parentId as TalentId) && build.includes(talent.id) ? 'selected-link' : '');
      svg.append(line);
    }
  }
  root.append(svg);
  for (const talent of nodes) {
    const selected = build.includes(talent.id);
    const ready = talent.requires.every((id) => build.includes(id as TalentId));
    const state = selected ? 'Selected' : !talent.implemented ? 'Coming soon' : ready ? 'Available' : 'Requires talents';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `talent-node ${selected ? 'selected' : ''} ${!talent.implemented ? 'planned' : ''}`;
    button.id = `talent-${talent.id}`;
    button.style.gridRow = String(talent.tier + 1);
    button.style.gridColumn = talent.tier === 0 || talent.tier === 3 ? '1 / 3' : String(talent.slot + 1);
    if (talent.tier === 0 || talent.tier === 3) button.classList.add('center-node');
    button.setAttribute('aria-label', `Inspect ${talent.name}, ${state.toLowerCase()}`);
    button.setAttribute('aria-describedby', 'talent-description');
    button.title = `${talent.description}\n${state}`;
    const name = document.createElement('strong');
    name.textContent = talent.name;
    const status = document.createElement('span');
    status.textContent = `${selected ? '✓ ' : ''}${state}`;
    button.append(name, status);
    button.addEventListener('click', () => inspect(talent.id, true));
    button.addEventListener('focus', () => inspect(talent.id));
    root.append(button);
  }
}
