// TC-E2E-004: Settings 変更 → reload → 復元
// Tweaks 完全削除 (2026-05-05 / ADR-009) に伴い、新キー eh.settings ベースに書き換え。
// 旧キー eh.tweaks 残存でもクラッシュしない (新コードが旧キーを読まないことを担保) ケースを維持。
import { test, expect } from '@playwright/test';

test('persistence: localStorage に Settings が保存され reload で復元される', async ({ page }) => {
  await page.goto('/');

  // ビュアーを開いてツールバーで夜モードを ON にする
  await page.getByRole('button', { name: '赤ずきん をひらく' }).click();
  await page.getByRole('button', { name: '夜モードの切替' }).click();

  // localStorage に eh.settings として保存されている
  const stored = await page.evaluate(() => localStorage.getItem('eh.settings'));
  expect(stored).toBeTruthy();
  const parsed = JSON.parse(stored!);
  expect(parsed.night).toBe(true);
  // 新スキーマには旧フィールドが含まれない
  expect(parsed.fontSize).toBeUndefined();
  expect(parsed.accent).toBeUndefined();
  expect(parsed.font).toBeUndefined();

  // reload
  await page.reload();
  // <html> に night クラスが復元されている
  // useEffect が非同期で実行されるため、expect().toHaveClass() で自動リトライを使う (Playwright BP)
  await expect(page.locator('html')).toHaveClass(/night/, { timeout: 5000 });
});

test('persistence: 旧キー eh.tweaks が残存していても新コードはそれを読まない', async ({
  page,
}) => {
  // ページロード前に旧キーを仕込む (React マウント前に実行されることが保証される)
  await page.addInitScript(() => {
    localStorage.setItem(
      'eh.tweaks',
      JSON.stringify({
        shelfVariant: 'B',
        viewerVariant: 'A',
        ruby: false,
        night: true,
        fontSize: 30,
        accent: '#FF0000',
        font: 'klee',
      }),
    );
  });
  await page.goto('/');

  // アプリが正常にレンダリングされることを確認 (クラッシュしない)
  await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });

  // 新コードは eh.tweaks を読まないため、SETTINGS_DEFAULTS (ruby:true, night:false) で初期化される
  // → no-ruby クラスは付かない (ruby=true のまま)
  await expect(page.locator('html')).not.toHaveClass(/no-ruby/, { timeout: 5000 });
  // → night クラスも付かない (night=false のまま)
  await expect(page.locator('html')).not.toHaveClass(/night/, { timeout: 5000 });

  // 旧キー eh.tweaks はそのまま残存している (削除しない方針)
  const oldKey = await page.evaluate(() => localStorage.getItem('eh.tweaks'));
  expect(oldKey).toBeTruthy();
});

test('persistence: 旧スキーマ (fontSize/accent/font) を eh.settings に仕込んでもクラッシュしない', async ({
  page,
}) => {
  // normalizeSettings の whitelist で旧キーが除去されることを確認
  await page.addInitScript(() => {
    localStorage.setItem(
      'eh.settings',
      JSON.stringify({
        shelfVariant: 'B',
        viewerVariant: 'A',
        ruby: false,
        night: false,
        fontSize: 30, // 旧スキーマキー (無視される)
        accent: '#FF0000', // 旧スキーマキー (無視される)
        font: 'klee', // 旧スキーマキー (無視される)
      }),
    );
  });
  await page.goto('/');

  // アプリが正常にレンダリングされることを確認
  await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });
  // ruby=false → .no-ruby クラスが html に付与される
  await expect(page.locator('html')).toHaveClass(/no-ruby/, { timeout: 5000 });

  // normalizeSettings の whitelist で旧キーが除去され、4 キーのみが保存される
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => localStorage.getItem('eh.settings'));
      return raw ? Object.keys(JSON.parse(raw as string)).sort() : [];
    })
    .toEqual(['night', 'ruby', 'shelfVariant', 'viewerVariant']);
});
