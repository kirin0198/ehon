// TC-IL: illustration-path のユニットテスト
import { describe, it, expect } from 'vitest';
import { illustrationPath, coverPath } from '../../src/lib/illustration-path';

describe('illustration-path', () => {
  it('TC-IL-001 通常パス生成', () => {
    expect(illustrationPath('akazukin', 'forest-girl')).toBe(
      '/illustrations/akazukin/forest-girl.webp',
    );
  });

  it('TC-IL-002 coverPath は scene=cover の糖衣', () => {
    expect(coverPath('momotaro')).toBe(illustrationPath('momotaro', 'cover'));
  });
});
