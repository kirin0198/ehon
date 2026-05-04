// TC-IF: IllustWithFallback のテスト
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { IllustWithFallback } from '../../src/components/common/IllustWithFallback';

describe('IllustWithFallback', () => {
  it('TC-IF-001 初期は <img> を描画する', () => {
    const { container } = render(
      <IllustWithFallback
        storyId="akazukin"
        scene="forest-girl"
        placeholderEmoji="🧣"
        bgColor="#F2C879"
        alt="赤ずきん"
      />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('/illustrations/akazukin/forest-girl.webp');
  });

  it('TC-IF-002 onError で placeholderEmoji + bg 色面に切り替わる', () => {
    const { container } = render(
      <IllustWithFallback
        storyId="akazukin"
        scene="forest-girl"
        placeholderEmoji="🧣"
        bgColor="#F2C879"
        alt="赤ずきん"
      />,
    );
    const img = container.querySelector('img');
    fireEvent.error(img!);
    // img は消え、絵文字 div + role=img が現れる
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: '赤ずきん' })).toBeInTheDocument();
    // 絵文字テキストの存在
    expect(screen.getByText('🧣')).toBeInTheDocument();
  });

  it('TC-IF-003 eager=true で loading=eager', () => {
    const { container } = render(
      <IllustWithFallback
        storyId="momotaro"
        scene="cover"
        placeholderEmoji="🍑"
        bgColor="#F2A6B8"
        alt="桃太郎の表紙"
        eager
      />,
    );
    const img = container.querySelector('img');
    expect(img!.getAttribute('loading')).toBe('eager');
  });
});
