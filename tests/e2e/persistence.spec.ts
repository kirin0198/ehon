// TC-E2E-004: Tweaks 変更 → reload → 復元
// 本番固定化 (2026-05-04) により fontSize 永続化シナリオを削除。
// 旧スキーマキー (fontSize/accent/font) 残存でもクラッシュしないことを追加検証。
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
  const parsed = JSON.parse(stored!);
  expect(parsed.night).toBe(true);
  // 新スキーマには fontSize / accent / font が含まれない
  expect(parsed.fontSize).toBeUndefined();
  expect(parsed.accent).toBeUndefined();
  expect(parsed.font).toBeUndefined();

  // reload
  await page.reload();
  // <html> に night クラスが復元されている
  // useEffect が非同期で実行されるため、expect().toHaveClass() で自動リトライを使う (Playwright BP)
  await expect(page.locator('html')).toHaveClass(/night/, { timeout: 5000 });
});

test('persistence: 旧スキーマ (fontSize/accent/font) 残存でもクラッシュしない', async ({
  page,
}) => {
  // ページロード前に旧スキーマを仕込む (React マウント前に実行されることが
  // 保証されるため、TweaksProvider の lazy initializer が確実にこの値を読む)
  // これにより WebKit の「goto → 永続化 useEffect 書き戻し → setItem 上書き」レースを回避する
  await page.addInitScript(() => {
    localStorage.setItem(
      'eh.tweaks',
      JSON.stringify({
        shelfVariant: 'B',
        viewerVariant: 'A',
        ruby: false,
        night: false,
        fontSize: 30, // 旧スキーマキー
        accent: '#FF0000', // 旧スキーマキー
        font: 'klee', // 旧スキーマキー
      }),
    );
  });
  await page.goto('/');

  // アプリが正常にレンダリングされることを確認 (クラッシュしない)
  await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });
  // ruby=false → .no-ruby クラスが html に付与される
  await expect(page.locator('html')).toHaveClass(/no-ruby/, { timeout: 5000 });
  // normalizeTweaks の whitelist で旧キーが除去され、永続化 useEffect が
  // 新スキーマ 4 キー (shelfVariant/viewerVariant/ruby/night) で再書き込みする
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => localStorage.getItem('eh.tweaks'));
      return raw ? Object.keys(JSON.parse(raw as string)).sort() : [];
    })
    .toEqual(['night', 'ruby', 'shelfVariant', 'viewerVariant']);
});
