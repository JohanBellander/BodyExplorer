import * as THREE from 'three';
import './styles.css';
import { BodyController } from './app/bodyController';
import { Picker } from './interaction/picking';
import { loadBody } from './model/loadBody';
import { MaterialLibrary } from './model/materials';
import { CameraRig } from './scene/cameraRig';
import { Stage } from './scene/stage';
import { mountControlsPanel } from './ui/controlsPanel';
import { byId } from './ui/dom';
import { mountHiddenPanel } from './ui/hiddenPanel';
import { mountInfoPanel } from './ui/infoPanel';
import { mountKeyboard } from './ui/keyboard';
import { mountQualityToggles } from './ui/quality';

const loadingOverlay = byId('loading-overlay');
const loadingBar = byId('loading-bar');
const loadingText = byId('loading-text');

function setProgress(fraction: number): void {
  const pct = Math.round(fraction * 100);
  loadingBar.style.width = `${pct}%`;
  loadingText.textContent = `Loading anatomy model... ${pct}%`;
}

async function start(): Promise<void> {
  const stage = new Stage(byId<HTMLCanvasElement>('canvas3d'));
  const rig = new CameraRig(stage);
  const materials = new MaterialLibrary();

  const body = await loadBody({ baseUrl: import.meta.env.BASE_URL, materials, onProgress: setProgress });
  stage.scene.add(body.root);

  const controller = new BodyController(body, materials, () => stage.invalidate());
  new Picker(stage, controller, (mesh) => controller.select(mesh));
  controller.subscribe((kind) => {
    if (kind === 'selection') stage.setOutlined(controller.selected ? [controller.selected] : []);
    if (kind === 'visibility') stage.refreshShadows();
  });

  mountInfoPanel(controller, { focus: (m) => rig.focus(m) });
  mountHiddenPanel(controller);
  mountControlsPanel(controller, rig, (mesh) => {
    controller.reveal(mesh);
    controller.select(mesh);
    rig.focus(mesh);
  });
  mountKeyboard(controller, rig);
  mountQualityToggles(stage);
  stage.controls.addEventListener('start', () => rig.cancel());

  const box = new THREE.Box3().setFromObject(body.root);
  stage.fitTo(box);
  rig.frame(box);

  // Exposed for debugging and end-to-end tests.
  Object.assign(window, { bodyExplorer: { stage, controller, rig } });
  document.body.dataset.ready = 'true';

  loadingOverlay.style.opacity = '0';
  setTimeout(() => (loadingOverlay.style.display = 'none'), 500);
}

start().catch((error: unknown) => {
  console.error('Failed to load anatomy model:', error);
  loadingText.textContent = 'Failed to load anatomy model. Check the console for details.';
  loadingText.style.color = '#e74c3c';
});
