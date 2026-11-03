import { expect, test } from '@playwright/test';

test('loads the model, picks a part and shows its info', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.waitForTimeout(1500); // let the intro camera move finish

  const counts = await page.evaluate(() => {
    const app = (
      window as unknown as {
        bodyExplorer: { controller: { body: { muscles: unknown[]; bones: unknown[] } } };
      }
    ).bodyExplorer;
    return { muscles: app.controller.body.muscles.length, bones: app.controller.body.bones.length };
  });
  expect(counts.muscles).toBeGreaterThan(400);
  expect(counts.bones).toBeGreaterThan(150);

  await page.screenshot({ path: 'test-results/home.png' });

  // Click the middle of the torso.
  const canvas = page.locator('#canvas3d');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('no canvas');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.38);
  await expect(page.locator('#info-panel')).not.toHaveClass(/hidden/);
  await expect(page.locator('#info-name')).not.toBeEmpty();
  await page.screenshot({ path: 'test-results/selected.png' });

  // A drag must rotate, not select something else.
  const before = await page.locator('#info-name').textContent();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('#info-name')).toHaveText(before ?? '');

  // Search selects and focuses.
  await page.fill('#search', 'gluteus max');
  await page.keyboard.press('Enter');
  await expect(page.locator('#info-name')).toContainText('Gluteus Maximus');

  // Esc deselects.
  await page.locator('#canvas3d').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#info-panel')).toHaveClass(/hidden/);

  expect(errors).toEqual([]);
});
