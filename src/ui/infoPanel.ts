import { isUnknownInfo } from '../data/anatomyDb';
import { MUSCLE_GROUPS } from '../data/muscleGroups';
import type { BodyController } from '../app/bodyController';
import { HIGHLIGHT_COLORS } from '../model/materials';
import { getAnatomySearchTerm } from '../model/names';
import type { AnatomyPart, PartMesh } from '../model/types';
import { byId, el } from './dom';

export interface InfoPanelActions {
  focus(mesh: PartMesh): void;
}

function row(label: string, value: string): HTMLParagraphElement {
  return el('p', {}, el('strong', {}, `${label}: `), value);
}

function details(part: AnatomyPart): HTMLElement[] {
  const rows: HTMLElement[] = [];
  if (part.kind !== 'bone') rows.push(row('Group', MUSCLE_GROUPS[part.group].label));
  if (part.side !== 'Center') rows.push(row('Side', part.side));
  const info = part.info;
  if (info && !isUnknownInfo(info)) {
    const muscle = part.kind === 'muscle';
    rows.push(row(muscle ? 'Origin' : 'From', info.origin));
    rows.push(row(muscle ? 'Insertion' : 'To', info.insertion));
    rows.push(row(muscle ? 'Action' : 'Function', info.action));
    if (info.innervation) rows.push(row('Innervation', info.innervation));
    if (info.notes) rows.push(row('Notes', info.notes));
  } else if (part.kind !== 'bone') {
    rows.push(el('p', { className: 'muted' }, 'No detailed entry yet; see the references below.'));
  }
  if (part.fmaId) rows.push(row('FMA', part.fmaId));
  return rows;
}

function links(part: AnatomyPart): HTMLAnchorElement[] {
  const term = getAnatomySearchTerm(part.rawName);
  const suffix = part.kind === 'bone' ? 'bone' : part.kind === 'tendon' ? 'anatomy' : 'muscle anatomy';
  const mk = (text: string, href: string) =>
    el('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text);
  return [
    mk('Wikipedia', `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(`${term} ${suffix}`)}`),
    mk('Kenhub', `https://www.kenhub.com/en/search?q=${encodeURIComponent(term)}`),
  ];
}

export function mountInfoPanel(body: BodyController, actions: InfoPanelActions): void {
  const panel = byId('info-panel');
  const name = byId('info-name');
  const badge = byId('info-type');
  const detailsEl = byId('info-details');
  const linksEl = byId('info-links');
  const swatches = byId('color-swatches');
  const picker = byId('info-color-picker');

  const swatchButtons = HIGHLIGHT_COLORS.map((c, i) => {
    const b = el('button', { className: 'color-swatch', title: c.name, type: 'button' });
    b.style.backgroundColor = c.hex;
    b.setAttribute('aria-label', `Highlight ${c.name}`);
    b.addEventListener('click', () => body.selected && body.setCustomColor(body.selected, i));
    swatches.append(b);
    return b;
  });

  byId('btn-clear-color').addEventListener(
    'click',
    () => body.selected && body.setCustomColor(body.selected, null),
  );
  byId('btn-hide-part').addEventListener('click', () => body.selected && body.hide(body.selected));
  byId('btn-focus-part').addEventListener('click', () => body.selected && actions.focus(body.selected));
  byId('info-close').addEventListener('click', () => body.select(null));

  const render = () => {
    const mesh = body.selected;
    if (!mesh) {
      panel.classList.add('hidden');
      return;
    }
    const part = mesh.userData.part;
    name.textContent = part.displayName;
    badge.textContent = part.kind;
    badge.className = `badge ${part.kind}`;
    detailsEl.replaceChildren(...details(part));
    linksEl.replaceChildren(...links(part));
    picker.hidden = part.kind === 'bone';
    const active = body.customColors.get(mesh);
    swatchButtons.forEach((b, i) => {
      b.classList.toggle('active', active === i);
      b.setAttribute('aria-pressed', String(active === i));
    });
    panel.classList.remove('hidden');
  };

  body.subscribe((kind) => {
    if (kind === 'selection' || kind === 'appearance') render();
  });
}
