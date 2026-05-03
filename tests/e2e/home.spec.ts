// TC-E2E-001: 本棚 → 物語選択 → 表紙 → 全ページ閲覧 → 戻る
import { test, expect } from '@playwright/test';

test('home: 本棚 → 物語 → 表紙 → 全ページ → 戻る が完遂する', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/きょうは どのおはなしを よもうかな/)).toBeVisible();

  // 赤ずきん を開く
  await page.getByRole('button', { name: '赤ずきん をひらく' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // CTA「よみはじめる」(複数候補があるので first)
  await page
    .getByRole('button', { name: /よみはじめる/ })
    .first()
    .click();

  // 全ページめくる (赤ずきん: pages.length=7 → 表紙 + 7 = 8 ページ)
  for (let i = 0; i < 7; i++) {
    await page.getByRole('button', { name: 'つぎのページ' }).click();
    // アニメーションロックを待つ
    await page.waitForTimeout(550);
  }

  // 最終ページで「つぎのページ」が disabled
  await expect(page.getByRole('button', { name: 'つぎのページ' })).toBeDisabled();

  // 戻る
  await page.getByRole('button', { name: 'ほんだなへもどる' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/きょうは どのおはなしを よもうかな/)).toBeVisible();
});
