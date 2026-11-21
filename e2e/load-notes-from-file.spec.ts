import { join } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * A visitor loads public/sample-notes.json through the ··· menu. The atlas
 * switches to those notes, keeps them after a reload, and "Back to the demo
 * notes" brings the bundled set back.
 */
test('a visitor loads their own notes from a file', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('cleared')) {
      localStorage.removeItem('knowledge-atlas');
      sessionStorage.setItem('cleared', '1');
    }
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'List' }).click();
  await expect(page.getByRole('button', { name: /Hiring sync/ })).toBeVisible();

  await page.getByRole('button', { name: 'Page actions' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load notes from file…' }).click();
  await (await chooser).setFiles(join(process.cwd(), 'public/sample-notes.json'));

  await expect(
    page.getByRole('region', { name: /Notifications/ }).getByText('Loaded 8 notes from sample-notes.json'),
  ).toBeVisible();
  const garden = page.getByRole('button', { name: /Spring garden plan/ });
  await expect(garden).toContainText('Unsorted');
  await expect(page.getByRole('button', { name: /Hiring sync/ })).toHaveCount(0);

  await page.reload();
  await page.getByRole('tab', { name: 'List' }).click();
  await expect(page.getByRole('button', { name: /Spring garden plan/ })).toBeVisible();

  await page.getByRole('button', { name: 'Page actions' }).click();
  await page.getByRole('button', { name: 'Back to the demo notes' }).click();
  await expect(page.getByRole('button', { name: /Hiring sync/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Spring garden plan/ })).toHaveCount(0);
});
