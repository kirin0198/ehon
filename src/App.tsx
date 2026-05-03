// アプリのルートコンポーネント。
// 本棚 / ビュアー / Tweaks パネルを統括する。
import { useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TweaksProvider, useTweaks } from './stores/tweaks-context';
import { ShelfA } from './components/shelves/ShelfA';
import { ShelfB } from './components/shelves/ShelfB';
import { ViewerA } from './components/viewers/ViewerA';
import { ViewerB } from './components/viewers/ViewerB';
import { TweaksLauncher } from './components/tweaks/TweaksLauncher';
import { TweaksPanel } from './components/tweaks/TweaksPanel';
import { STORIES } from './data/stories';

function AppShell() {
  const { tweaks, setTweak } = useTweaks();
  const [openId, setOpenId] = useState<string | null>(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const story = openId ? (STORIES.find((s) => s.id === openId) ?? null) : null;

  const Shelf = tweaks.shelfVariant === 'A' ? ShelfA : ShelfB;
  const Viewer = tweaks.viewerVariant === 'A' ? ViewerA : ViewerB;

  return (
    <>
      <Shelf
        stories={STORIES}
        onOpen={(id) => setOpenId(id)}
        shelfVariant={tweaks.shelfVariant}
        setShelfVariant={(v) => setTweak('shelfVariant', v)}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />
      {story && (
        <Viewer
          story={story}
          onClose={() => setOpenId(null)}
          ruby={tweaks.ruby}
          fontSize={tweaks.fontSize}
          night={tweaks.night}
          setRuby={(v) => setTweak('ruby', v)}
          setFontSize={(v) => setTweak('fontSize', v)}
          setNight={(v) => setTweak('night', v)}
          variant={tweaks.viewerVariant}
          setVariant={(v) => setTweak('viewerVariant', v)}
        />
      )}
      <TweaksLauncher onClick={() => setTweaksOpen((v) => !v)} open={tweaksOpen} />
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
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
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TweaksProvider>
        <AppShell />
      </TweaksProvider>
    </ErrorBoundary>
  );
}
