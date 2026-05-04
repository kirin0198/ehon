// TC-E2E-003: ふりがな ON/OFF で <rt> の可視性が変わる
import { test, expect } from '@playwright/test';

test('ruby-toggle: ふりがな切替で <rt> 可視性が変わる', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '赤ずきん をひらく' }).click();

  // 表紙のタイトルにルビ (<rt>) があるはず
  // expect().toBeVisible() を使うことで、React の rerender で DOM ノードが再生成された場合も
  // 自動的に再解決されるため、locator が detached になるタイムアウトを回避する (Playwright BP)
  const rt = page.locator('rt').first();
  await expect(rt).toBeVisible({ timeout: 5000 });

  // ふりがなトグルを OFF
  await page.getByRole('button', { name: 'ふりがなの切替' }).click();
  // .no-ruby が html に付与される → <rt> は DOM に残るが CSS で display:none (SPEC R-005)
  // toBeHidden() は display:none でも pass するため CSS 制御の検証に適している
  await expect(page.locator('rt').first()).toBeHidden({ timeout: 5000 });
});
