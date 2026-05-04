// TC-E2E-002: マウスを使わずキーボードのみで本棚 → ビュアー → 全ページ → 戻る
import { test, expect } from '@playwright/test';

test('viewer-keyboard: キーボードのみで完遂', async ({ page }) => {
  await page.goto('/');

  // 物語ボタンへ Tab で移動 → Enter (フォーカスを直接表紙ボタンに当てる)
  await page.getByRole('button', { name: '赤ずきん をひらく' }).focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog')).toBeVisible();

  // CTA Enter
  const cta = page.getByRole('button', { name: /よみはじめる/ }).first();
  await cta.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(550);

  // ArrowRight で全ページめくる
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(550);
  }

  // ArrowLeft で 1 ページ戻る
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(550);

  // Esc で閉じる
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
