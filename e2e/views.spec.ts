import { expect, test, type Page } from '@playwright/test';

// Captures a fixed set of views to test-results/views/ for visual review (before/after comparisons).
// Run: npx playwright test views --reporter=line

type Vec = [number, number, number];
interface Shot {
  name: string;
  pos: Vec;
  target: Vec;
  setup?: string;
}

const SHOTS: Shot[] = [
  { name: 'front', pos: [0, 0, 62], target: [0, 0, 0] },
  { name: 'torso', pos: [6, 6, 20], target: [0, 5, 0] },
  { name: 'back', pos: [0, 2, -40], target: [0, 2, 0] },
  { name: 'shoulder', pos: [12, 10, 9], target: [4.5, 9, 0] },
  { name: 'closeup', pos: [5, 9.5, 6.5], target: [2.5, 8, 1] },
  { name: 'knee', pos: [5, -7, 9], target: [1.5, -8, 0] },
  {
    name: 'selected',
    pos: [8, 8, 18],
    target: [3, 7, 0],
    setup:
      "c.select(c.body.muscles.find((m) => m.userData.part.rawName === 'acromial part of left deltoid'))",
  },
  { name: 'xray', pos: [0, 4, 30], target: [0, 4, 0], setup: 'c.setMuscleOpacity(0.35)' },
];

async function waitIdle(page: Page) {
  await page.waitForTimeout(600);
}

test('frame time while orbiting', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.waitForTimeout(1500);
  const ms = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const app = (window as never as { bodyExplorer: { stage: any } }).bodyExplorer;
        const times: number[] = [];
        let last = performance.now();
        let n = 0;
        const step = () => {
          const now = performance.now();
          times.push(now - last);
          last = now;
          app.stage.controls.rotateLeft?.(0.02);
          app.stage.camera.position.applyAxisAngle({ x: 0, y: 1, z: 0, isVector3: true } as never, 0.02);
          app.stage.invalidate();
          if (++n < 120) requestAnimationFrame(step);
          else resolve(times.slice(10));
        };
        requestAnimationFrame(step);
      }),
  );
  ms.sort((a, b) => a - b);
  console.log(
    `frame ms: median ${ms[Math.floor(ms.length / 2)]!.toFixed(1)}, p95 ${ms[Math.floor(ms.length * 0.95)]!.toFixed(1)}`,
  );
});

test('capture views', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.addStyleTag({ content: '#ui-overlay { display: none !important; }' });
  await page.waitForTimeout(1500);
  for (const s of SHOTS) {
    await page.evaluate(
      ({ pos, target, setup }) => {
        const app = (window as never as { bodyExplorer: { stage: any; controller: any; rig: any } })
          .bodyExplorer;
        const c = app.controller;
        c.reset();
        app.rig.cancel();
        app.stage.camera.position.set(...pos);
        app.stage.controls.target.set(...target);
        app.stage.controls.update();
        if (setup) new Function('c', setup)(c);
        app.stage.invalidate();
      },
      { pos: s.pos, target: s.target, setup: s.setup ?? '' },
    );
    await waitIdle(page);
    await page.screenshot({ path: `test-results/views/${s.name}.png` });
  }
});
