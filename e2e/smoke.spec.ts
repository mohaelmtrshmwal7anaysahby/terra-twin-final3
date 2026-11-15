import { expect, test } from '@playwright/test';

const ROUTES = [
  'welcome',
  'home',
  'moon',
  'mars',
  'explorer',
  'compare/atacama/mars-jezero',
  'location/iceland',
  'explorer-hub',
  'student-hub',
  'scientist-hub',
  'astronaut-hub',
  'about',
  'settings',
];

for (const route of ROUTES) {
  test(`route #/${route} renders without uncaught errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/#/${route}`);
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('main#main-content h1, main#main-content h2').first()).toBeVisible({
      timeout: 15_000,
    });
    expect(errors).toEqual([]);
  });
}

test('the bare URL opens the cinematic observatory, not a form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /choose your mission/i }).first()).toBeVisible();
});

test('unknown routes show the 404 page', async ({ page }) => {
  await page.goto('/#/definitely-not-a-page');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/off the map/i);
});

test('Arabic preference switches the document to RTL', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('terratwin_lang_50', 'ar');
    window.localStorage.setItem('terratwin_locale', 'ar');
  });
  await page.goto('/#/home');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('theme preference is applied to the document', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('terratwin_theme', 'light'));
  await page.goto('/#/home');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});

test('skip link moves focus to main content without changing the route', async ({ page }) => {
  await page.goto('/#/about');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();
  expect(page.url()).toContain('#/about');
});
