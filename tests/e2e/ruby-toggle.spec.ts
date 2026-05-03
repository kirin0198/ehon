// TC-E2E-003: ふりがな ON/OFF で <rt> の可視性が変わる
import { test, expect } from '@playwright/test';

test('ruby-toggle: ふりがな切替で <rt> 可視性が変わる', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '赤ずきん をひらく' }).click();

  // 表紙のタイトルにルビ (<rt>) があるはず
  const rt = page.locator('rt').first();
  await expect(rt).toHaveCount(1, { timeout: 2000 });
  // CSS display を確認
  const visibleBefore = await rt.evaluate((el) => getComputedStyle(el).display !== 'none');
  expect(visibleBefore).toBe(true);

  // ふりがなトグルを OFF
  await page.getByRole('button', { name: 'ふりがなの切替' }).click();
  // .no-ruby が html に付与される → display:none
  const visibleAfter = await rt.evaluate((el) => getComputedStyle(el).display !== 'none');
  expect(visibleAfter).toBe(false);
});
