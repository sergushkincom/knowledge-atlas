import { expect, test } from '@playwright/test';

/**
 * Hiring sync starts in Meetings, with Interview prep as the other plausible topic.
 * The test moves it to Design work, which is neither of those, and locks it.
 * Re-sort would send it to Interview prep if the lock were ignored.
 * Design critique 14.03 is left unlocked, so the same pass moves it to Design work.
 */
test('a user correction survives an AI re-sort', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('knowledge-atlas');
  });
  await page.goto('/');

  await page.getByRole('tab', { name: 'List' }).click();
  const hiring = page.getByRole('button', { name: /Hiring sync/ });
  const critique = page.getByRole('button', { name: /Design critique 14\.03/ });
  await expect(hiring).toContainText('Meetings');
  await expect(critique).toContainText('Meetings');

  await hiring.click();
  const peek = page.locator('aside');
  await expect(peek.getByRole('heading', { name: 'Hiring sync' })).toBeVisible();
  await peek.getByRole('button', { name: 'Meetings', exact: true }).click();
  await peek.getByRole('button', { name: 'Design work', exact: true }).click();

  await expect(peek.getByRole('button', { name: 'Design work', exact: true })).toBeVisible();
  await expect(peek.getByText('Moved by you')).toBeVisible();
  await expect(peek.getByRole('button', { name: 'Locked by you' })).toBeVisible();
  await expect(peek.getByText('100%')).toBeVisible();
  await expect(hiring).toContainText('Design work');

  await page.getByRole('button', { name: 'Re-sort', exact: true }).click();

  await expect(peek.getByRole('heading', { name: 'Hiring sync' })).toBeVisible();
  await expect(peek.getByRole('button', { name: 'Design work', exact: true })).toBeVisible();
  await expect(peek.getByText('Moved by you')).toBeVisible();
  await expect(peek.getByRole('button', { name: 'Locked by you' })).toBeVisible();
  await expect(peek.getByText('100%')).toBeVisible();
  await expect(hiring).toContainText('Design work');

  await expect(critique).toContainText('Design work');
  await critique.click();
  await expect(peek.getByRole('heading', { name: 'Design critique 14.03' })).toBeVisible();
  await expect(peek.getByRole('button', { name: 'Design work', exact: true })).toBeVisible();
  await expect(peek.getByText('Re-clustered to the other plausible topic.')).toBeVisible();
  await expect(peek.getByRole('button', { name: 'Unlocked' })).toBeVisible();
});
