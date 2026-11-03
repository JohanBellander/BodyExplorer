import type { BodyController } from '../app/bodyController';
import type { CameraRig } from '../scene/cameraRig';

export function mountKeyboard(body: BodyController, rig: CameraRig): void {
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.key) {
      case 'Escape':
        body.select(null);
        break;
      case 'h':
      case 'H':
        if (body.selected) body.hide(body.selected);
        break;
      case 'f':
      case 'F':
        if (body.selected) rig.focus(body.selected);
        break;
      case '1':
        rig.view('front');
        break;
      case '2':
        rig.view('back');
        break;
      case '3':
        rig.view('left');
        break;
      case '4':
        rig.view('right');
        break;
      case 'r':
      case 'R':
        body.reset();
        rig.home();
        break;
      case '/':
        e.preventDefault();
        document.getElementById('search')?.focus();
        break;
      default:
        return;
    }
  });
}
