import type { BodyController } from '../app/bodyController';
import { searchParts } from '../app/search';
import { MUSCLE_GROUPS, MUSCLE_GROUP_KEYS } from '../data/muscleGroups';
import type { PartMesh } from '../model/types';
import type { CameraRig } from '../scene/cameraRig';
import { byId, el } from './dom';

export function mountControlsPanel(
  body: BodyController,
  rig: CameraRig,
  choose: (mesh: PartMesh) => void,
): void {
  mountSearch(body, choose);
  mountGroupFilters(body);

  const skeleton = byId<HTMLInputElement>('toggle-skeleton');
  const tendons = byId<HTMLInputElement>('toggle-tendons');
  const groupColors = byId<HTMLInputElement>('toggle-group-colors');
  const muscleOpacity = byId<HTMLInputElement>('muscle-opacity-slider');
  const boneOpacity = byId<HTMLInputElement>('skeleton-opacity-slider');

  skeleton.addEventListener('change', () => body.setShowSkeleton(skeleton.checked));
  tendons.addEventListener('change', () => body.setShowTendons(tendons.checked));
  groupColors.addEventListener('change', () => body.setColorMode(groupColors.checked ? 'group' : 'natural'));
  muscleOpacity.addEventListener('input', () => body.setMuscleOpacity(Number(muscleOpacity.value)));
  boneOpacity.addEventListener('input', () => body.setBoneOpacity(Number(boneOpacity.value)));

  byId('btn-front').addEventListener('click', () => rig.view('front'));
  byId('btn-back').addEventListener('click', () => rig.view('back'));
  byId('btn-left').addEventListener('click', () => rig.view('left'));
  byId('btn-right').addEventListener('click', () => rig.view('right'));
  byId('btn-reset').addEventListener('click', () => {
    body.reset();
    rig.home();
  });

  // Keep the inputs in sync when state changes elsewhere (e.g. Reset).
  body.subscribe(() => {
    skeleton.checked = body.showSkeleton;
    tendons.checked = body.showTendons;
    groupColors.checked = body.colorMode === 'group';
    muscleOpacity.value = String(body.muscleOpacity);
    boneOpacity.value = String(body.boneOpacity);
  });
}

function mountSearch(body: BodyController, choose: (mesh: PartMesh) => void): void {
  const input = byId<HTMLInputElement>('search');
  const results = byId('search-results');
  const searchable = body.allParts.map((mesh) => ({ mesh, displayName: mesh.userData.part.displayName }));
  let active = -1;
  let current: typeof searchable = [];

  const close = () => {
    results.replaceChildren();
    input.setAttribute('aria-expanded', 'false');
    current = [];
    active = -1;
  };

  const pick = (i: number) => {
    const item = current[i];
    if (!item) return;
    choose(item.mesh);
    input.value = '';
    close();
    input.blur();
  };

  const render = () => {
    results.replaceChildren(
      ...current.map((item, i) => {
        const kind = item.mesh.userData.part.kind;
        const div = el(
          'div',
          { className: `search-item${i === active ? ' active' : ''}` },
          item.displayName,
          el('span', { className: `search-kind ${kind}` }, kind),
        );
        div.setAttribute('role', 'option');
        div.setAttribute('aria-selected', String(i === active));
        div.addEventListener('pointerdown', (e) => {
          e.preventDefault(); // keep focus so blur doesn't close the list first
          pick(i);
        });
        return div;
      }),
    );
    input.setAttribute('aria-expanded', String(current.length > 0));
  };

  input.addEventListener('input', () => {
    current = searchParts(searchable, input.value);
    active = current.length ? 0 : -1;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!current.length) return;
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + current.length) % current.length;
      render();
    } else if (e.key === 'Enter') {
      pick(active);
    } else if (e.key === 'Escape') {
      input.value = '';
      close();
      input.blur();
    }
  });
  input.addEventListener('blur', () => setTimeout(close, 100));
}

function mountGroupFilters(body: BodyController): void {
  const container = byId('muscle-group-filters');
  const buttons = MUSCLE_GROUP_KEYS.filter((k) =>
    body.body.muscles.some((m) => m.userData.part.group === k),
  ).map((key) => {
    const group = MUSCLE_GROUPS[key];
    const dot = el('span', { className: 'group-dot' });
    dot.style.backgroundColor = group.color;
    const btn = el('button', { className: 'filter-btn active', type: 'button' }, dot, group.label);
    btn.setAttribute('aria-pressed', 'true');
    btn.addEventListener('click', () => body.setGroupActive(key, !body.activeGroups.has(key)));
    container.append(btn);
    return { key, btn };
  });
  body.subscribe((kind) => {
    if (kind !== 'visibility') return;
    for (const { key, btn } of buttons) {
      const on = body.activeGroups.has(key);
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    }
  });
}
