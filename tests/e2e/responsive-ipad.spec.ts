// TC-E2E-005: iPad プロファイルでレイアウト崩れなし、100dvh が利く
// プロジェクト webkit-ipad のみで実行する。
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1024, height: 768 } });

test('responsive-ipad: 1024x768 でレイアウト崩れなし', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'iPad シナリオは WebKit のみ');
  await page.goto('/');

  // ヘッダーが画面内にある
  const header = page.locator('.eh-header').first();
  await expect(header).toBeVisible();

  // 本棚エリアがビューポートに収まっている (はみ出しチェック)
  const stage = page.locator('.shelf-a-stage, .shelf-b-stage').first();
  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(1024 + 1);

  // ビュアーを開いて 100dvh 想定の高さが確保される
  await page.getByRole('button', { name: '赤ずきん をひらく' }).click();
  const viewerHeight = await page
    .locator('.eh-viewer')
    .first()
    .evaluate((el) => el.clientHeight);
  // 768 に近いことを確認 (ツールバー差分の余裕を見る)
  expect(viewerHeight).toBeGreaterThan(700);
});
