import type { Stage } from '../scene/stage';
import { byId } from './dom';

export function mountQualityToggles(stage: Stage): void {
  const ao = byId<HTMLInputElement>('toggle-ao');
  const shadows = byId<HTMLInputElement>('toggle-shadows');
  ao.checked = stage.quality.ambientOcclusion;
  shadows.checked = stage.quality.shadows;
  ao.addEventListener('change', () => stage.setAmbientOcclusion(ao.checked));
  shadows.addEventListener('change', () => stage.setShadows(shadows.checked));
}
