// TC-E2E-003: タッチスワイプでビュアーのページ送り (Phase 1 / ADR-010 / RTL: ADR-012)
// - react-swipeable (delta=50) で右/左スワイプを検出 (右綴じ仕様)
// - 右スワイプ = 次ページ / 左スワイプ = 前ページ (ACR-2 / ACR-6)
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

// スワイプを合成する E2E ヘルパ。
//
// 経緯 (2026-05-05):
//   旧実装は `new TouchEvent(...)` / `new Touch(...)` を `page.evaluate` 内で
//   呼んでいたが、WebKit (Safari) はこれらのコンストラクタを直接呼ぶことを
//   許可しておらず "Illegal constructor" で失敗していた (chromium-pc は通る)。
//   一方、本アプリが使う react-swipeable v7 は touch / mouse のみリッスンし
//   (Pointer Events 非対応)、ViewerA/B では `trackMouse: false` のため
//   mouse ドラッグでも合成不可。さらに viewer 側で `delta: 50` の閾値を持つ。
//
// 解決策:
//   react-swipeable のイベント判定は `"touches" in event` のみ
//   (instanceof TouchEvent ではない) なので、生の `Event('touchstart' …)` に
//   `Object.defineProperty` で `touches` / `targetTouches` / `changedTouches`
//   を後付けすれば WebKit でも安全に発火できる。
//   touches 内の各 Touch も plain object でよく、`clientX/clientY` さえ
//   揃っていれば react-swipeable は座標を読み取れる。
//
//   さらに、delta=50 の閾値内側で複数ステップに分けて touchmove を発火する
//   ことで、ライブラリ側の deltaX 累積計算をより自然な軌跡で進める。
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

  await page.evaluate(
    ({ sx, sy, ex, ey }: { sx: number; sy: number; ex: number; ey: number }) => {
      const target = document.elementFromPoint(sx, sy) ?? document.body;

      // WebKit でも安全な touch オブジェクト生成 (new Touch を使わない)
      const mkTouch = (x: number, y: number): unknown => ({
        identifier: 1,
        target,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        screenX: x,
        screenY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      });

      // `Event` に touches 系を後付けして dispatch。
      // react-swipeable は `"touches" in event` で判定するため
      // TouchEvent 実体である必要はない。
      const fireTouch = (
        type: 'touchstart' | 'touchmove' | 'touchend',
        x: number,
        y: number,
        isEnd = false,
      ): void => {
        const ev = new Event(type, { bubbles: true, cancelable: true });
        const touchList = isEnd ? [] : [mkTouch(x, y)];
        const changed = [mkTouch(x, y)];
        Object.defineProperty(ev, 'touches', { value: touchList, configurable: true });
        Object.defineProperty(ev, 'targetTouches', { value: touchList, configurable: true });
        Object.defineProperty(ev, 'changedTouches', { value: changed, configurable: true });
        target.dispatchEvent(ev);
      };

      // 開始 → 中間 → 終了 の 3 段階で touchmove を発火
      // (delta=50 の閾値超えを安定させるため、移動量が大きい場合は刻む)
      fireTouch('touchstart', sx, sy);

      const steps = 4;
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        const cx = sx + (ex - sx) * t;
        const cy = sy + (ey - sy) * t;
        fireTouch('touchmove', cx, cy);
      }

      fireTouch('touchend', ex, ey, true);
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

  test('右スワイプ (70px) → 次ページに進む', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    const prevBtn = page.getByRole('button', { name: 'まえのページ' });

    // 最初は「まえのページ」無効 (1 ページ目)
    await expect(prevBtn).toBeEnabled({ timeout: 1000 });

    // 右綴じ仕様: 右スワイプ (+70px) → 次ページ (ACR-2)
    await swipe(page, stage, 70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });
    // 2 ページ目に進んだので pageIndex が増加している
    // (progressbar の aria-valuenow で確認)
    const progress = page.getByRole('progressbar');
    const valuenow = await progress.getAttribute('aria-valuenow');
    expect(Number(valuenow)).toBeGreaterThanOrEqual(3);
  });

  test('左スワイプ (70px) → 前ページに戻る', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });

    // まず右スワイプで 2 ページ目へ (右綴じ仕様)
    await swipe(page, stage, 70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const progressBefore = page.getByRole('progressbar');
    const before = Number(await progressBefore.getAttribute('aria-valuenow'));

    // 左スワイプ (-70px) で前ページに戻る (ACR-2)
    await swipe(page, stage, -70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const after = Number(await progressBefore.getAttribute('aria-valuenow'));
    expect(after).toBe(before - 1);
  });

  test('短い横スワイプ (30px) はページ送りされない', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const progress = page.getByRole('progressbar');
    const before = Number(await progress.getAttribute('aria-valuenow'));

    // 30px は閾値 50px 未満 → 反応しない (方向に依存しない)
    await swipe(page, stage, 30, 0);
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

    // 1 回目のスワイプ (フリップロック開始) — 右スワイプ=次ページ (RTL 仕様)
    await swipe(page, stage, 70, 0);
    // フリップロック中 (200ms) に 2 回目スワイプ → 無視されるはず
    await page.waitForTimeout(200);
    await swipe(page, stage, 70, 0);
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

  test('ViewerB: 右スワイプ (70px) → 次ページに進む', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const progress = page.getByRole('progressbar');
    const before = Number(await progress.getAttribute('aria-valuenow'));

    // 右綴じ仕様: 右スワイプ (+70px) → 次ページ (ACR-6)
    await swipe(page, stage, 70, 0);
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const after = Number(await progress.getAttribute('aria-valuenow'));
    expect(after).toBeGreaterThan(before);
  });

  test('ViewerB: 左スワイプ (70px) → 前ページに戻る', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'タッチデバイスのみ実行');

    const stage = page.locator('.eh-viewer-stage').first();
    const nextBtn = page.getByRole('button', { name: 'つぎのページ' });
    const progress = page.getByRole('progressbar');

    // まず右スワイプで次ページへ (右綴じ仕様)
    await swipe(page, stage, 70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const before = Number(await progress.getAttribute('aria-valuenow'));

    // 左スワイプ (-70px) で前ページに戻る (ACR-6)
    await swipe(page, stage, -70, 0);
    await expect(nextBtn).toBeEnabled({ timeout: 3000 });

    const after = Number(await progress.getAttribute('aria-valuenow'));
    expect(after).toBe(before - 1);
  });
});
