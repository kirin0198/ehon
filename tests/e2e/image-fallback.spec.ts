// TC-E2E-006: 画像不在シナリオで placeholder にフォールバックする
import { test, expect } from '@playwright/test';

test('image-fallback: 不在画像は placeholderEmoji + 色面で代替表示される', async ({ page }) => {
  // 全 illustrations を 404 にしてフォールバックを誘発
  await page.route('**/illustrations/**/*.webp', (route) => route.fulfill({ status: 404 }));
  await page.goto('/');

  // ShelfB に切替えて表紙画像のフォールバックを露わにする。
  // Tweaks 完全削除 (2026-05-05 / ADR-009) により、本棚切替は Header の ShelfSwitcher (role=tab) 経由に変更。
  const tabB = page.getByRole('tab', { name: /表紙ならべ/ });
  await tabB.click();

  // role=img の代替表示が現れる (alt 属性で発見)
  const fallback = page.getByRole('img', { name: '赤ずきん の表紙' }).first();
  await expect(fallback).toBeVisible();

  // ビュアーを開いて本文ページのフォールバックも確認
  await page.getByRole('button', { name: '赤ずきん をひらく' }).click();
  await page
    .getByRole('button', { name: /よみはじめる/ })
    .first()
    .click();
  await page.waitForTimeout(550);

  const sceneFallback = page.getByRole('img', { name: /赤ずきん:/ }).first();
  await expect(sceneFallback).toBeVisible();
});
