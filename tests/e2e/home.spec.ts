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
  // 表紙の「よみはじめる」CTA で pageIndex=0→1 が済んでいるため、残り 6 回で最終ページ
  // 各 click 後にページ番号 (ViewerA ".book-a-pageno") が更新されるのを待ち、
  // フリップアニメーションロック (500ms) を状態ベースで確認する (時間ベースの waitForTimeout より堅牢)
  const pageNo = page.locator('.book-a-pageno');
  const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
  for (let i = 1; i <= 6; i++) {
    await nextBtn.click();
    await expect(pageNo).toContainText(`${i + 1} / 7`, { timeout: 3000 });
  }

  // 最終ページで「つぎのページ」が disabled
  await expect(nextBtn).toBeDisabled();

  // 戻る
  await page.getByRole('button', { name: 'ほんだなへもどる' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/きょうは どのおはなしを よもうかな/)).toBeVisible();
});
