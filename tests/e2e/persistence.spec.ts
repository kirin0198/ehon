// TC-E2E-004: Tweaks 変更 → reload → 復元
import { test, expect } from '@playwright/test';

test('persistence: localStorage に Tweaks が保存され reload で復元される', async ({ page }) => {
  await page.goto('/');

  // Tweaks を開く
  await page.getByRole('button', { name: 'Tweaks せってい' }).click();
  // 夜モードを ON
  const nightSwitch = page
    .getByRole('switch', { name: '夜モード' })
    .or(page.getByLabel('夜モード'));
  await nightSwitch.click();

  // localStorage に保存されている (アプリのフォーマット)
  const stored = await page.evaluate(() => localStorage.getItem('eh.tweaks'));
  expect(stored).toBeTruthy();
  expect(JSON.parse(stored!).night).toBe(true);

  // reload
  await page.reload();
  // <html> に night クラスが復元されている
  const hasNightClass = await page.evaluate(() =>
    document.documentElement.classList.contains('night'),
  );
  expect(hasNightClass).toBe(true);
});
