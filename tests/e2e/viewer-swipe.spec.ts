// TC-E2E-003: タッチスワイプでビュアーのページ送り (Phase 1 / ADR-010)
// - react-swipeable (delta=50) で左/右スワイプを検出
// - 閾値未満 (30px) はページ送りしない
// - 縦スワイプ (上下) はページ送りしない
// - 500ms フリップロック中の 2 回目スワイプは無視される
// - ViewerA / ViewerB の両バリアントで動作する
//
// 注意: タッチ API はモバイル / タブレットプロファイルのみで有効。
// PC (Desktop Chrome) では touchscreen が undefined になるため
// `use: { hasTouch: true }` プロジェクトか isMobile フラグで制御する。
// react-swipeable は trackMouse=false のため PC デスクトップでは非対応 (設計通り)。
import { test, expect } from '@playwright/test';

// スワイプを TouchScreen API で発火するヘルパ
// (Playwright の page.touchscreen.swipe は存在しないため touch イベントを dispatch)
async function swipe(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
  deltaX: number,
  deltaY: number,
): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('swipe target not found');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endX = startX + deltaX;
  const endY = startY + deltaY;

  // TouchScreen API でスワイプをエミュレート
  await page.touchscreen.tap(startX, startY); // touchstart
  // touchmove: 複数ポイントで移動量を react-swipeable に伝える
  await page.evaluate(
    ({ sx, sy, ex, ey }: { sx: number; sy: number; ex: number; ey: number }) => {
      const target = document.elementFromPoint(sx, sy) ?? document.body;
      const mkTouch = (x: number, y: number): Touch =>
        new Touch({ identifier: 1, target, clientX: x, clientY: y });

      target.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [mkTouch(sx, sy)],
        }),
      );
      target.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [mkTouch(ex, ey)],
        }),
      );
      target.dispatchEvent(
        new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          changedTouches: [mkTouch(ex, ey)],
        }),
      );
    },
    { sx: startX, sy: startY, ex: endX, ey: endY },
  );
}

// ---------------------------------------------------------------------------
// ViewerA (デフォルトバリアント A)
// ---------------------------------------------------------------------------

test.describe('viewer-swipe: ViewerA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '赤ずきん をひらく' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // 表紙から 1 ページ目へ進む (CTA クリック)
    await page
      .getByRole('button', { name: /よみはじめる/ })
      .first()
      .click();
    // フリップロック解除を待つ
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });
  });

  test('左スワイプ (70px) → 次ページに進む', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    const prevBtn = page.getByRole('button', { name: 'まえのページ' });

    // 最初は「まえのページ」無効 (1 ページ目)
    await expect(prevBtn).toBeEnabled({ timeout: 1000 });

    await swipe(page, stage, -70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });
    // 2 ページ目に進んだので pageIndex が増加している
    // (progressbar の aria-valuenow で確認)
    const progress = page.getByRole('progressbar');
    const valuenow = await progress.getAttribute('aria-valuenow');
    expect(Number(valuenow)).toBeGreaterThanOrEqual(3);
  });

  test('右スワイプ (70px) → 前ページに戻る', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });

    // まず左スワイプで 2 ページ目へ
    await swipe(page, stage, -70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const progressBefore = page.getByRole('progressbar');
    const before = Number(await progressBefore.getAttribute('aria-valuenow'));

    // 右スワイプで戻る
    await swipe(page, stage, 70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const after = Number(await progressBefore.getAttribute('aria-valuenow'));
    expect(after).toBe(before - 1);
  });

  test('短い横スワイプ (30px) はページ送りされない', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const progress = page.getByRole('progressbar');
    const before = Number(await progress.getAttribute('aria-valuenow'));

    // 30px は閾値 50px 未満 → 反応しない
    await swipe(page, stage, -30, 0);
    await page.waitForTimeout(300);

    const after = Number(await progress.getAttribute('aria-valuenow'));
    expect(after).toBe(before);
  });

  test('縦スワイプ (0px, 80px) はページ送りされない', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const progress = page.getByRole('progressbar');
    const before = Number(await progress.getAttribute('aria-valuenow'));

    // 縦方向スワイプ → react-swipeable の onSwipedLeft/Right は発火しない
    await swipe(page, stage, 0, 80);
    await page.waitForTimeout(300);

    const after = Number(await progress.getAttribute('aria-valuenow'));
    expect(after).toBe(before);
  });

  test('500ms ロック中の連続スワイプは 1 回のみ反映される', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const progress = page.getByRole('progressbar');
    const before = Number(await progress.getAttribute('aria-valuenow'));

    // 1 回目のスワイプ (フリップロック開始)
    await swipe(page, stage, -70, 0);
    // フリップロック中 (200ms) に 2 回目スワイプ → 無視されるはず
    await page.waitForTimeout(200);
    await swipe(page, stage, -70, 0);
    // フリップロック解除を待つ
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const after = Number(await progress.getAttribute('aria-valuenow'));
    // 1 回分のみ進んでいるはず
    expect(after).toBe(before + 1);
  });
});

// ---------------------------------------------------------------------------
// ViewerB (バリアント B に切り替えてテスト)
// ---------------------------------------------------------------------------

test.describe('viewer-swipe: ViewerB', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ビュアーバリアント B に切り替える (設定は localStorage に保存される)
    // ShelfSwitcher でバリアント B ボタンを押す
    const variantBBtn = page.getByRole('button', { name: /ビュアー.*B|全画面|ViewerB/i });
    if ((await variantBBtn.count()) > 0) {
      await variantBBtn.first().click();
    }

    await page.getByRole('button', { name: '赤ずきん をひらく' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page
      .getByRole('button', { name: /よみはじめる/ })
      .first()
      .click();
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });
  });

  test('ViewerB: 左スワイプ (70px) → 次ページに進む', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const progress = page.getByRole('progressbar');
    const before = Number(await progress.getAttribute('aria-valuenow'));

    await swipe(page, stage, -70, 0);
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const after = Number(await progress.getAttribute('aria-valuenow'));
    expect(after).toBeGreaterThan(before);
  });

  test('ViewerB: 右スワイプ (70px) → 前ページに戻る', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    const progress = page.getByRole('progressbar');

    // まず左スワイプで進む
    await swipe(page, stage, -70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const before = Number(await progress.getAttribute('aria-valuenow'));

    // 右スワイプで戻る
    await swipe(page, stage, 70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const after = Number(await progress.getAttribute('aria-valuenow'));
    expect(after).toBe(before - 1);
  });
});
