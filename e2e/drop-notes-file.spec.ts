import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const sample = readFileSync(join(process.cwd(), 'public/sample-notes.json'), 'utf8');

async function dropOnAtlas(page: Page, name: string, contents: string, type = 'application/json') {
  await page.evaluate(
    ({ name: fileName, contents: text, type: mime }) => {
      const host = document.querySelector('[data-atlas-root]');
      if (!host) {
        throw new Error('Atlas root is missing');
      }
      const file = new File([text], fileName, { type: mime });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      for (const kind of ['dragenter', 'dragover', 'drop']) {
        const event = new DragEvent(kind, { bubbles: true, cancelable: true, dataTransfer });
        host.dispatchEvent(event);
      }
    },
    { name, contents, type },
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('knowledge-atlas');
  });
  await page.goto('/');
});

test('dropping a notes file shows the drop zone and loads notes into Unsorted', async ({ page }) => {
  await page.getByRole('tab', { name: 'List' }).click();

  await page.evaluate(() => {
    const host = document.querySelector('[data-atlas-root]');
    if (!host) {
      throw new Error('Atlas root is missing');
    }
    const file = new File(['[]'], 'notes.json', { type: 'application/json' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    host.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer }));
  });
  await expect(page.getByText('Drop your notes')).toBeVisible();

  await dropOnAtlas(page, 'sample-notes.json', sample);
  await expect(page.getByText('Drop your notes')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: /Notifications/ }).getByText('Loaded 8 notes from sample-notes.json'),
  ).toBeVisible();

  const garden = page.getByRole('button', { name: /Spring garden plan/ });
  await expect(garden).toContainText('Unsorted');
  await expect(garden).toHaveAttribute('data-arrival-index', '0');
  await expect(garden).toHaveClass(/note-arrive/);
  const packing = page.getByRole('button', { name: /Packing list/ });
  await expect(packing).toHaveAttribute('data-arrival-index', '7');
  await expect(page.getByRole('button', { name: /Hiring sync/ })).toHaveCount(0);
});

test('a file that is not notes shows an error and leaves the demo in place', async ({ page }) => {
  await page.getByRole('tab', { name: 'List' }).click();
  await dropOnAtlas(page, 'notes.txt', 'not json', 'text/plain');
  const notice = page.getByRole('region', { name: /Notifications/ });
  await expect(notice.getByText('Notes not loaded')).toBeVisible();
  await expect(notice.getByText('This is not a JSON file.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Hiring sync/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Spring garden plan/ })).toHaveCount(0);
});

test('reduced motion shows the loaded notes without a staggered fade', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('tab', { name: 'List' }).click();
  await dropOnAtlas(page, 'sample-notes.json', sample);
  const packing = page.getByRole('button', { name: /Packing list/ });
  await expect(packing).toBeVisible();
  await expect(packing).toHaveCSS('animation-name', 'none');
  await expect(packing).toHaveCSS('opacity', '1');
});
