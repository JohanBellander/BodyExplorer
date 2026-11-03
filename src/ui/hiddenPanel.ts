import type { BodyController } from '../app/bodyController';
import { byId, el } from './dom';

export function mountHiddenPanel(body: BodyController): void {
  const panel = byId('hidden-panel');
  const count = byId('hidden-count');
  const list = byId('hidden-list');
  byId('btn-show-all').addEventListener('click', () => body.unhideAll());

  body.subscribe((kind) => {
    if (kind !== 'visibility') return;
    count.textContent = String(body.hidden.size);
    panel.classList.toggle('hidden', body.hidden.size === 0);
    list.replaceChildren(
      ...[...body.hidden].map((mesh) => {
        const label = mesh.userData.part.displayName;
        const show = el('button', { type: 'button', textContent: 'Show' });
        show.addEventListener('click', () => body.unhide(mesh));
        return el('li', {}, el('span', { className: 'hidden-part-name', title: label }, label), show);
      }),
    );
  });
}
