// アクセント色プリセット (UI で露出する候補)
// モック CSS 変数群 (--terracotta / --matcha-deep / --sky / --mustard / --sakura) から
// 子供向けに馴染みやすい 4 色を選定。Standard 昇格時は visual-designer で再選定可能。

export type AccentPreset = {
  label: string;
  value: string; // CSS color (hex)
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { label: 'テラコッタ', value: '#E07856' },
  { label: 'まっちゃ', value: '#4F7A57' },
  { label: 'そら', value: '#A9D6E5' },
  { label: 'さくら', value: '#F2A6B8' },
];

export const DEFAULT_ACCENT = ACCENT_PRESETS[0].value;
