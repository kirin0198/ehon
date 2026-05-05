// アプリのルートコンポーネント。
// 本棚 / ビュアーを統括する。
// Tweaks 完全削除 (2026-05-05 / ADR-009): TweaksProvider / tweaksOpen / TweaksLauncher / TweaksPanel を削除し
// useSettingsStore 単一 hook で 4 設定を管理する。
import { useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useSettingsStore } from './stores/settings-store';
import { ShelfA } from './components/shelves/ShelfA';
import { ShelfB } from './components/shelves/ShelfB';
import { ViewerA } from './components/viewers/ViewerA';
import { ViewerB } from './components/viewers/ViewerB';
import { STORIES } from './data/stories';

export default function App() {
  const { settings, setSetting } = useSettingsStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const story = openId ? (STORIES.find((s) => s.id === openId) ?? null) : null;

  const Shelf = settings.shelfVariant === 'A' ? ShelfA : ShelfB;
  const Viewer = settings.viewerVariant === 'A' ? ViewerA : ViewerB;

  return (
    <ErrorBoundary>
      <>
        <Shelf
          stories={STORIES}
          onOpen={(id) => setOpenId(id)}
          shelfVariant={settings.shelfVariant}
          setShelfVariant={(v) => setSetting('shelfVariant', v)}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
        {story && (
          <Viewer
            story={story}
            onClose={() => setOpenId(null)}
            ruby={settings.ruby}
            night={settings.night}
            setRuby={(v) => setSetting('ruby', v)}
            setNight={(v) => setSetting('night', v)}
            variant={settings.viewerVariant}
            setVariant={(v) => setSetting('viewerVariant', v)}
          />
        )}
        <footer
          style={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            padding: '6px 14px',
            fontSize: 11,
            color: 'var(--ink-soft)',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        >
          原作: パブリックドメイン (古典童話) / 再話・コード: © 2026 えほんやさん (MIT)
        </footer>
      </>
    </ErrorBoundary>
  );
}
